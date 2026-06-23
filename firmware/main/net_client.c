#include "net_client.h"
#include "sd_config.h"
#include "sd_shared.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_log.h"
#include "esp_http_client.h"
#include "esp_crt_bundle.h"
#include "cJSON.h"
#include <string.h>

static const char *TAG = "net_client";

static EventGroupHandle_t s_wifi_eg;
#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT      BIT1
static int s_retries = 0;

static void wifi_event_handler(void *arg, esp_event_base_t base, int32_t id, void *data) {
  if (base == WIFI_EVENT && id == WIFI_EVENT_STA_START) {
    esp_wifi_connect();
  } else if (base == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED) {
    if (s_retries < SD_WIFI_MAX_RETRY) {
      esp_wifi_connect();
      s_retries++;
      ESP_LOGW(TAG, "reconectando Wi-Fi (%d/%d)", s_retries, SD_WIFI_MAX_RETRY);
    } else {
      xEventGroupSetBits(s_wifi_eg, WIFI_FAIL_BIT);
    }
  } else if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
    s_retries = 0;
    xEventGroupSetBits(s_wifi_eg, WIFI_CONNECTED_BIT);
  }
}

bool net_client_wifi_connect(void) {
  s_wifi_eg = xEventGroupCreate();
  ESP_ERROR_CHECK(esp_netif_init());
  ESP_ERROR_CHECK(esp_event_loop_create_default());
  esp_netif_create_default_wifi_sta();

  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  ESP_ERROR_CHECK(esp_wifi_init(&cfg));
  ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, wifi_event_handler, NULL));
  ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, wifi_event_handler, NULL));

  wifi_config_t wc = {0};
  strncpy((char *)wc.sta.ssid, SD_WIFI_SSID, sizeof(wc.sta.ssid) - 1);
  strncpy((char *)wc.sta.password, SD_WIFI_PASS, sizeof(wc.sta.password) - 1);
  ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
  ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wc));
  ESP_ERROR_CHECK(esp_wifi_start());

  EventBits_t bits = xEventGroupWaitBits(s_wifi_eg, WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
                                         pdFALSE, pdFALSE, portMAX_DELAY);
  return (bits & WIFI_CONNECTED_BIT) != 0;
}

// Adiciona um número OU null (quando !present) ao objeto.
static void add_num_or_null(cJSON *obj, const char *key, double v, bool present) {
  if (present) cJSON_AddNumberToObject(obj, key, v);
  else cJSON_AddNullToObject(obj, key);
}

static char *build_payload(const sd_telemetry_record_t *rec) {
  cJSON *root = cJSON_CreateObject();
  cJSON_AddStringToObject(root, "deviceId", SD_DEVICE_ID);
  cJSON_AddStringToObject(root, "vehicleId", SD_VEHICLE_ID);
  cJSON_AddStringToObject(root, "sessionId", SD_SESSION_ID);
  cJSON_AddNumberToObject(root, "timestamp", (double)rec->fused.ts_ms);

  const sd_gps_fix_t *g = &rec->fused.gps;
  cJSON *gps = cJSON_AddObjectToObject(root, "gps");
  add_num_or_null(gps, "lat", g->lat, g->has_fix);
  add_num_or_null(gps, "lng", g->lng, g->has_fix);
  add_num_or_null(gps, "speedKmh", g->speed_kmh, g->has_fix);
  add_num_or_null(gps, "satellites", g->satellites, g->has_fix);
  add_num_or_null(gps, "hdop", g->hdop, g->has_fix);

  const sd_imu_sample_t *m = &rec->fused.imu;
  cJSON *imu = cJSON_AddObjectToObject(root, "imu");
  cJSON_AddNumberToObject(imu, "accelX", m->accel_x);
  cJSON_AddNumberToObject(imu, "accelY", m->accel_y);
  cJSON_AddNumberToObject(imu, "accelZ", m->accel_z);
  cJSON_AddNumberToObject(imu, "gyroX", m->gyro_x);
  cJSON_AddNumberToObject(imu, "gyroY", m->gyro_y);
  cJSON_AddNumberToObject(imu, "gyroZ", m->gyro_z);

  cJSON *ev = cJSON_AddObjectToObject(root, "events");
  cJSON_AddBoolToObject(ev, "hardAcceleration", rec->events.hard_acceleration);
  cJSON_AddBoolToObject(ev, "hardBrake", rec->events.hard_brake);
  cJSON_AddBoolToObject(ev, "sharpTurn", rec->events.sharp_turn);
  cJSON_AddBoolToObject(ev, "impactSuspected", rec->events.impact_suspected);

  cJSON *bat = cJSON_AddObjectToObject(root, "battery");
  cJSON_AddNullToObject(bat, "voltage");      // sem sensor de bateria por ora
  cJSON_AddNullToObject(bat, "percentage");

  char *json = cJSON_PrintUnformatted(root);
  cJSON_Delete(root);
  return json; // chamador faz free()
}

static bool post_telemetry(const char *json) {
  esp_http_client_config_t cfg = {
      .url = SD_TELEMETRY_URL,
      .method = HTTP_METHOD_POST,
      .timeout_ms = SD_HTTP_TIMEOUT_MS,
      // HTTPS (Cloud Run): valida o certificado contra o bundle de CAs do ESP-IDF
      // (CONFIG_MBEDTLS_CERTIFICATE_BUNDLE=y). Para URL http:// é ignorado.
      .crt_bundle_attach = esp_crt_bundle_attach,
  };
  esp_http_client_handle_t cli = esp_http_client_init(&cfg);
  esp_http_client_set_header(cli, "Content-Type", "application/json");
  esp_http_client_set_post_field(cli, json, strlen(json));
  esp_err_t err = esp_http_client_perform(cli);
  bool ok = false;
  if (err == ESP_OK) {
    int status = esp_http_client_get_status_code(cli);
    ok = status >= 200 && status < 300;
    if (!ok) ESP_LOGW(TAG, "POST status %d", status);
  } else {
    ESP_LOGW(TAG, "POST falhou: %s", esp_err_to_name(err));
  }
  esp_http_client_cleanup(cli);
  return ok;
}

static void net_task(void *arg) {
  (void)arg;
  const TickType_t period = pdMS_TO_TICKS(1000 / SD_NETWORK_HZ);
  TickType_t last = xTaskGetTickCount();
  sd_telemetry_record_t rec, latest;

  for (;;) {
    bool have = false;
    // bloqueia até existir ao menos um registro, depois drena para o mais recente
    if (xQueueReceive(sd_record_queue, &latest, portMAX_DELAY) == pdTRUE) {
      have = true;
      while (xQueueReceive(sd_record_queue, &rec, 0) == pdTRUE) latest = rec;
    }
    if (have) {
      char *json = build_payload(&latest);
      if (json) {
        post_telemetry(json);
        free(json);
      }
    }
    vTaskDelayUntil(&last, period);
  }
}

void net_client_start(void) {
  xTaskCreate(net_task, "net_client", 6144, NULL, 4, NULL);
}
