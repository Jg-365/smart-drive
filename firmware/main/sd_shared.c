#include "sd_shared.h"
#include "sd_config.h"
#include <string.h>

QueueHandle_t sd_fused_queue = NULL;
QueueHandle_t sd_record_queue = NULL;

static SemaphoreHandle_t s_mutex = NULL;
static sd_imu_sample_t s_imu;
static sd_gps_fix_t s_gps;

bool sd_shared_init(void) {
  s_mutex = xSemaphoreCreateMutex();
  sd_fused_queue = xQueueCreate(8, sizeof(sd_fused_sample_t));
  sd_record_queue = xQueueCreate(SD_OFFLINE_BUFFER, sizeof(sd_telemetry_record_t));
  memset(&s_imu, 0, sizeof(s_imu));
  memset(&s_gps, 0, sizeof(s_gps));
  s_gps.has_fix = false;
  return s_mutex && sd_fused_queue && sd_record_queue;
}

void sd_shared_set_imu(const sd_imu_sample_t *s) {
  if (xSemaphoreTake(s_mutex, portMAX_DELAY) == pdTRUE) {
    s_imu = *s;
    xSemaphoreGive(s_mutex);
  }
}

void sd_shared_get_imu(sd_imu_sample_t *out) {
  if (xSemaphoreTake(s_mutex, portMAX_DELAY) == pdTRUE) {
    *out = s_imu;
    xSemaphoreGive(s_mutex);
  }
}

void sd_shared_set_gps(const sd_gps_fix_t *s) {
  if (xSemaphoreTake(s_mutex, portMAX_DELAY) == pdTRUE) {
    s_gps = *s;
    xSemaphoreGive(s_mutex);
  }
}

void sd_shared_get_gps(sd_gps_fix_t *out) {
  if (xSemaphoreTake(s_mutex, portMAX_DELAY) == pdTRUE) {
    *out = s_gps;
    xSemaphoreGive(s_mutex);
  }
}
