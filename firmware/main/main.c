// SmartDrive ESP32 — ponto de entrada. Orquestra os drivers e as tasks FreeRTOS.
// JOA-TEC-02. Pipeline:
//   imu_reader (50Hz) ─┐
//                      ├─► sensor_fusion (10Hz) ─► event_detector (10Hz) ─► net_client (POST /telemetry)
//   gps_reader (NMEA) ─┘
//   health_monitor (1Hz) observa heap/uptime.
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "nvs_flash.h"

#include "sd_shared.h"
#include "imu_reader.h"
#include "gps_reader.h"
#include "sensor_fusion.h"
#include "event_detector.h"
#include "net_client.h"
#include "health_monitor.h"

static const char *TAG = "smartdrive";

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

  // Rede por último: conecta o Wi-Fi e só então sobe a task de envio.
  if (net_client_wifi_connect()) {
    ESP_LOGI(TAG, "Wi-Fi conectado — iniciando envio de telemetria");
    net_client_start();
  } else {
    ESP_LOGE(TAG, "Wi-Fi indisponível — coletando localmente, sem envio");
  }

  ESP_LOGI(TAG, "SmartDrive firmware operacional.");
}
