// SmartDrive ESP32 — provisioning de Wi-Fi via SoftAP + captive portal. JOA-RF B2.
//
// Fluxo: sem credenciais no NVS, o boot chama provisioning_run_portal(), que:
//   1. sobe um AP aberto "SmartDrive-Setup" (modo APSTA p/ poder escanear redes);
//   2. serve um portal HTTP em http://192.168.4.1 (lista redes, recebe senha);
//   3. um DNS "hijack" resolve qualquer domínio para 192.168.4.1, fazendo o
//      celular abrir o portal sozinho (tela "Acessar a rede");
//   4. ao receber a rede escolhida, grava SSID/senha no NVS e REINICIA a placa.
// No boot seguinte já existem credenciais → net_client conecta como STA.
#include "provisioning.h"
#include "sd_config.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_http_server.h"
#include "esp_log.h"
#include "esp_system.h"
#include "nvs.h"
#include "nvs_flash.h"
#include "cJSON.h"

#include "lwip/sockets.h"
#include <string.h>
#include <stdlib.h>

static const char *TAG = "provisioning";
static const char *NVS_NS  = "sd_wifi";
static const char *NVS_SSID = "ssid";
static const char *NVS_PASS = "pass";

static EventGroupHandle_t s_prov_eg;
#define PROV_DONE_BIT BIT0

// ── NVS ──────────────────────────────────────────────────────────────────────
bool provisioning_get_credentials(char *ssid, char *pass) {
  nvs_handle_t h;
  if (nvs_open(NVS_NS, NVS_READONLY, &h) != ESP_OK) return false;
  size_t sl = SD_PROV_SSID_MAXLEN, pl = SD_PROV_PASS_MAXLEN;
  esp_err_t es = nvs_get_str(h, NVS_SSID, ssid, &sl);
  esp_err_t ep = nvs_get_str(h, NVS_PASS, pass, &pl);
  nvs_close(h);
  if (es != ESP_OK || ssid[0] == '\0') return false;
  if (ep != ESP_OK) pass[0] = '\0'; // rede aberta: senha vazia é válida
  return true;
}

static void save_credentials(const char *ssid, const char *pass) {
  nvs_handle_t h;
  ESP_ERROR_CHECK(nvs_open(NVS_NS, NVS_READWRITE, &h));
  ESP_ERROR_CHECK(nvs_set_str(h, NVS_SSID, ssid));
  ESP_ERROR_CHECK(nvs_set_str(h, NVS_PASS, pass ? pass : ""));
  ESP_ERROR_CHECK(nvs_commit(h));
  nvs_close(h);
  ESP_LOGI(TAG, "credenciais gravadas: SSID='%s'", ssid);
}

void provisioning_clear(void) {
  nvs_handle_t h;
  if (nvs_open(NVS_NS, NVS_READWRITE, &h) != ESP_OK) return;
  nvs_erase_all(h);
  nvs_commit(h);
  nvs_close(h);
  ESP_LOGW(TAG, "credenciais apagadas");
}

// ── Página do portal (HTML+CSS+JS inline, sem dependências externas) ──────────
static const char PORTAL_HTML[] =
  "<!doctype html><html lang='pt-br'><head><meta charset='utf-8'>"
  "<meta name='viewport' content='width=device-width,initial-scale=1'>"
  "<title>SmartDrive · Configurar Wi-Fi</title><style>"
  "*{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,sans-serif}"
  "body{margin:0;background:#0a0e14;color:#e6edf3;padding:20px}"
  ".wrap{max-width:420px;margin:0 auto}"
  "h1{font-size:18px;letter-spacing:2px;text-transform:uppercase;color:#00e5ff;margin:8px 0 2px}"
  ".sub{font-size:12px;color:#7d8590;margin-bottom:18px}"
  "label{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#7d8590;display:block;margin:14px 0 6px}"
  "input{width:100%;padding:12px;background:#10151d;border:1px solid #222b36;color:#e6edf3;font-size:15px;border-radius:6px}"
  "button{width:100%;padding:13px;margin-top:18px;background:#00e5ff;color:#04121a;border:0;border-radius:6px;font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase}"
  "button:disabled{opacity:.5}"
  ".net{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;background:#10151d;border:1px solid #222b36;border-radius:6px;margin-bottom:6px;cursor:pointer}"
  ".net.sel{border-color:#00e5ff}"
  ".net small{color:#7d8590}"
  "#msg{margin-top:14px;font-size:13px;text-align:center;min-height:18px}"
  ".rescan{background:none;color:#00e5ff;border:1px solid #222b36;margin-top:8px}"
  "</style></head><body><div class='wrap'>"
  "<h1>SmartDrive</h1><div class='sub'>Selecione a rede Wi-Fi do local</div>"
  "<div id='nets'>Procurando redes…</div>"
  "<button class='rescan' onclick='scan()'>Procurar de novo</button>"
  "<label>Rede selecionada</label><input id='ssid' placeholder='Nome da rede (SSID)'>"
  "<label>Senha</label><input id='pass' type='password' placeholder='Senha da rede'>"
  "<button id='go' onclick='save()'>Conectar</button>"
  "<div id='msg'></div></div><script>"
  "function pick(s,el){document.getElementById('ssid').value=s;"
  "document.querySelectorAll('.net').forEach(n=>n.classList.remove('sel'));el.classList.add('sel');"
  "document.getElementById('pass').focus();}"
  "function scan(){var c=document.getElementById('nets');c.textContent='Procurando redes…';"
  "fetch('/scan').then(r=>r.json()).then(function(l){c.innerHTML='';"
  "if(!l.length){c.textContent='Nenhuma rede encontrada.';return;}"
  "l.forEach(function(n){var d=document.createElement('div');d.className='net';"
  "d.onclick=function(){pick(n.ssid,d)};"
  "d.innerHTML=\"<span>\"+(n.lock?'🔒 ':'')+n.ssid+\"</span><small>\"+n.rssi+\" dBm</small>\";"
  "c.appendChild(d);});}).catch(function(){c.textContent='Falha ao procurar redes.';});}"
  "function save(){var s=document.getElementById('ssid').value.trim();"
  "var p=document.getElementById('pass').value;var m=document.getElementById('msg');"
  "if(!s){m.textContent='Escolha uma rede.';m.style.color='#ff5252';return;}"
  "document.getElementById('go').disabled=true;m.style.color='#00e5ff';"
  "m.textContent='Salvando… o SmartDrive vai reiniciar e conectar.';"
  "fetch('/save',{method:'POST',headers:{'Content-Type':'application/json'},"
  "body:JSON.stringify({ssid:s,pass:p})}).then(function(){"
  "m.textContent='Pronto! Pode fechar esta tela. O SmartDrive está conectando à rede \"'+s+'\".';"
  "}).catch(function(){m.textContent='Não foi possível salvar. Tente de novo.';"
  "m.style.color='#ff5252';document.getElementById('go').disabled=false;});}"
  "scan();</script></body></html>";

// ── Handlers HTTP ────────────────────────────────────────────────────────────
static esp_err_t root_handler(httpd_req_t *req) {
  // Qualquer GET (inclusive os "probes" de captive portal dos celulares)
  // devolve a página → o sistema operacional abre o portal sozinho.
  httpd_resp_set_type(req, "text/html");
  return httpd_resp_send(req, PORTAL_HTML, HTTPD_RESP_USE_STRLEN);
}

static esp_err_t scan_handler(httpd_req_t *req) {
  wifi_scan_config_t sc = { .show_hidden = false };
  cJSON *arr = cJSON_CreateArray();
  if (esp_wifi_scan_start(&sc, true) == ESP_OK) {
    uint16_t n = 0;
    esp_wifi_scan_get_ap_num(&n);
    if (n > 20) n = 20;
    wifi_ap_record_t *recs = calloc(n, sizeof(wifi_ap_record_t));
    if (recs && esp_wifi_scan_get_ap_records(&n, recs) == ESP_OK) {
      for (int i = 0; i < n; i++) {
        if (recs[i].ssid[0] == '\0') continue;
        cJSON *o = cJSON_CreateObject();
        cJSON_AddStringToObject(o, "ssid", (const char *)recs[i].ssid);
        cJSON_AddNumberToObject(o, "rssi", recs[i].rssi);
        cJSON_AddBoolToObject(o, "lock", recs[i].authmode != WIFI_AUTH_OPEN);
        cJSON_AddItemToArray(arr, o);
      }
    }
    free(recs);
  }
  char *json = cJSON_PrintUnformatted(arr);
  cJSON_Delete(arr);
  httpd_resp_set_type(req, "application/json");
  httpd_resp_sendstr(req, json ? json : "[]");
  free(json);
  return ESP_OK;
}

static esp_err_t save_handler(httpd_req_t *req) {
  int total = req->content_len;
  if (total <= 0 || total > 512) {
    httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "payload inválido");
    return ESP_FAIL;
  }
  char buf[513];
  int got = 0;
  while (got < total) {
    int r = httpd_req_recv(req, buf + got, total - got);
    if (r <= 0) { httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "recv"); return ESP_FAIL; }
    got += r;
  }
  buf[got] = '\0';

  cJSON *root = cJSON_Parse(buf);
  const cJSON *js = root ? cJSON_GetObjectItem(root, "ssid") : NULL;
  const cJSON *jp = root ? cJSON_GetObjectItem(root, "pass") : NULL;
  if (!cJSON_IsString(js) || js->valuestring[0] == '\0') {
    cJSON_Delete(root);
    httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "ssid ausente");
    return ESP_FAIL;
  }
  save_credentials(js->valuestring, cJSON_IsString(jp) ? jp->valuestring : "");
  cJSON_Delete(root);

  httpd_resp_set_type(req, "application/json");
  httpd_resp_sendstr(req, "{\"ok\":true}");
  xEventGroupSetBits(s_prov_eg, PROV_DONE_BIT);
  return ESP_OK;
}

static httpd_handle_t start_webserver(void) {
  httpd_config_t cfg = HTTPD_DEFAULT_CONFIG();
  cfg.uri_match_fn = httpd_uri_match_wildcard;
  cfg.lru_purge_enable = true;
  httpd_handle_t srv = NULL;
  if (httpd_start(&srv, &cfg) != ESP_OK) {
    ESP_LOGE(TAG, "httpd_start falhou");
    return NULL;
  }
  httpd_uri_t scan = { .uri = "/scan", .method = HTTP_GET,  .handler = scan_handler };
  httpd_uri_t save = { .uri = "/save", .method = HTTP_POST, .handler = save_handler };
  httpd_uri_t root = { .uri = "/*",    .method = HTTP_GET,  .handler = root_handler };
  httpd_register_uri_handler(srv, &scan);
  httpd_register_uri_handler(srv, &save);
  httpd_register_uri_handler(srv, &root); // curinga por último
  return srv;
}

// ── DNS hijack: responde toda consulta com 192.168.4.1 (abre o portal sozinho) ─
static void dns_hijack_task(void *arg) {
  int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
  if (sock < 0) { ESP_LOGW(TAG, "DNS: socket falhou"); vTaskDelete(NULL); return; }
  struct sockaddr_in srv = { .sin_family = AF_INET, .sin_port = htons(53),
                             .sin_addr.s_addr = htonl(INADDR_ANY) };
  if (bind(sock, (struct sockaddr *)&srv, sizeof(srv)) < 0) {
    ESP_LOGW(TAG, "DNS: bind falhou"); close(sock); vTaskDelete(NULL); return;
  }
  uint8_t pkt[256];
  for (;;) {
    struct sockaddr_in cli; socklen_t cl = sizeof(cli);
    int len = recvfrom(sock, pkt, sizeof(pkt) - 16, 0, (struct sockaddr *)&cli, &cl);
    if (len < (int)sizeof(uint16_t) * 6) continue;
    // Transforma a query em resposta: flags=0x8180, ANCOUNT=1.
    pkt[2] = 0x81; pkt[3] = 0x80;
    pkt[6] = 0x00; pkt[7] = 0x01;          // answers = 1
    pkt[8] = pkt[9] = pkt[10] = pkt[11] = 0; // NS/AR = 0
    int q = len;
    uint8_t ans[] = {
      0xC0, 0x0C,             // ponteiro p/ o nome na pergunta
      0x00, 0x01, 0x00, 0x01, // type A, class IN
      0x00, 0x00, 0x00, 0x3C, // TTL 60s
      0x00, 0x04,             // rdlength 4
      192, 168, 4, 1          // 192.168.4.1
    };
    if (q + (int)sizeof(ans) > (int)sizeof(pkt)) continue;
    memcpy(pkt + q, ans, sizeof(ans));
    sendto(sock, pkt, q + sizeof(ans), 0, (struct sockaddr *)&cli, cl);
  }
}

// ── Orquestração ─────────────────────────────────────────────────────────────
void provisioning_run_portal(void) {
  ESP_LOGW(TAG, "sem credenciais — subindo portal de configuração (AP '%s')", SD_PROV_AP_SSID);
  s_prov_eg = xEventGroupCreate();

  ESP_ERROR_CHECK(esp_netif_init());
  ESP_ERROR_CHECK(esp_event_loop_create_default());
  esp_netif_create_default_wifi_ap();
  esp_netif_create_default_wifi_sta(); // necessário p/ esp_wifi_scan_start em APSTA

  wifi_init_config_t ic = WIFI_INIT_CONFIG_DEFAULT();
  ESP_ERROR_CHECK(esp_wifi_init(&ic));

  wifi_config_t ap = {0};
  strncpy((char *)ap.ap.ssid, SD_PROV_AP_SSID, sizeof(ap.ap.ssid) - 1);
  ap.ap.ssid_len = strlen(SD_PROV_AP_SSID);
  ap.ap.channel = 1;
  ap.ap.max_connection = 4;
  ap.ap.authmode = WIFI_AUTH_OPEN; // aberto: qualquer celular entra sem senha
  ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_APSTA));
  ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &ap));
  ESP_ERROR_CHECK(esp_wifi_start());

  start_webserver();
  xTaskCreate(dns_hijack_task, "dns_hijack", 3072, NULL, 4, NULL);

  ESP_LOGI(TAG, "portal no ar: conecte ao Wi-Fi '%s' e abra http://192.168.4.1", SD_PROV_AP_SSID);

  // Bloqueia até o usuário enviar uma rede.
  xEventGroupWaitBits(s_prov_eg, PROV_DONE_BIT, pdFALSE, pdFALSE, portMAX_DELAY);

  ESP_LOGI(TAG, "credenciais recebidas — reiniciando para conectar…");
  vTaskDelay(pdMS_TO_TICKS(1500)); // deixa a resposta HTTP chegar no celular
  esp_restart();
}
