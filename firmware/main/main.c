// SmartDrive ESP32 — ponto de entrada. Orquestra os drivers e as tasks FreeRTOS.
// JOA-TEC-02. Pipeline:
//   imu_reader (50Hz) ─┐
//                      ├─► sensor_fusion (10Hz) ─► event_detector (10Hz) ─► net_client (POST /telemetry)
//   gps_reader (NMEA) ─┘
//   health_monitor (1Hz) observa heap/uptime.
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "driver/gpio.h"

#include "sd_config.h"
#include "sd_shared.h"
#include "imu_reader.h"
#include "gps_reader.h"
#include "sensor_fusion.h"
#include "event_detector.h"
#include "net_client.h"
#include "provisioning.h"
#include "health_monitor.h"

static const char *TAG = "smartdrive";

static void wifi_reset_button_task(void *arg) {
  (void)arg;
  gpio_config_t cfg = {
      .pin_bit_mask = 1ULL << SD_WIFI_RESET_GPIO,
      .mode = GPIO_MODE_INPUT,
      .pull_up_en = GPIO_PULLUP_ENABLE,
      .pull_down_en = GPIO_PULLDOWN_DISABLE,
      .intr_type = GPIO_INTR_DISABLE,
  };
  ESP_ERROR_CHECK(gpio_config(&cfg));

  int held_ms = 0;
  for (;;) {
    if (gpio_get_level(SD_WIFI_RESET_GPIO) == 0) {
      held_ms += 100;
      if (held_ms >= SD_WIFI_RESET_HOLD_MS) {
        ESP_LOGW(TAG, "botão BOOT pressionado por %dms — apagando Wi-Fi salvo", held_ms);
        provisioning_clear();
        vTaskDelay(pdMS_TO_TICKS(300));
        esp_restart();
      }
    } else {
      held_ms = 0;
    }
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void app_main(void) {
  ESP_LOGI(TAG, "SmartDrive firmware iniciando…");

  // NVS é exigido pelo Wi-Fi.
  esp_err_t nvs = nvs_flash_init();
  if (nvs == ESP_ERR_NVS_NO_FREE_PAGES || nvs == ESP_ERR_NVS_NEW_VERSION_FOUND) {
    ESP_ERROR_CHECK(nvs_flash_erase());
    ESP_ERROR_CHECK(nvs_flash_init());
  }

  if (!sd_shared_init()) {
    ESP_LOGE(TAG, "falha ao alocar estado/filas — abortando");
    return;
  }

  // Sensores (continuam mesmo sem rede — o pipeline bufferiza).
  if (imu_reader_init()) {
    imu_reader_start();
  } else {
    ESP_LOGE(TAG, "IMU indisponível — seguindo só com GPS/zeros");
  }
  if (gps_reader_init()) {
    gps_reader_start();
  } else {
    ESP_LOGE(TAG, "GPS indisponível — seguindo sem fix");
  }

  sensor_fusion_start();
  event_detector_start();
  health_monitor_start();
  xTaskCreate(wifi_reset_button_task, "wifi_reset_btn", 2048, NULL, 3, NULL);

  // Rede por último. Sem credenciais salvas → abre o portal de configuração
  // (SoftAP + captive portal); o usuário escolhe a rede pelo celular. O portal
  // grava no NVS e reinicia a placa, caindo no caminho de conexão abaixo.
  char ssid[SD_PROV_SSID_MAXLEN], pass[SD_PROV_PASS_MAXLEN];
  if (!provisioning_get_credentials(ssid, pass)) {
    provisioning_run_portal(); // bloqueia e reinicia ao salvar — não retorna
  }

  if (net_client_wifi_connect(ssid, pass)) {
    ESP_LOGI(TAG, "Wi-Fi conectado (%s) — iniciando envio de telemetria", ssid);
    net_client_start();
  } else {
    // Senha trocada/rede sumiu: apaga e reabre o portal no próximo boot.
    ESP_LOGE(TAG, "falha ao conectar em '%s' — limpando credenciais e reabrindo o portal", ssid);
    provisioning_clear();
    vTaskDelay(pdMS_TO_TICKS(1000));
    esp_restart();
  }

  ESP_LOGI(TAG, "SmartDrive firmware operacional.");
}
