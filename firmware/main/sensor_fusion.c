#include "sensor_fusion.h"
#include "sd_config.h"
#include "sd_shared.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_timer.h"
#include <string.h>

// Buffer circular para a média móvel das amostras de IMU.
typedef struct {
  sd_imu_sample_t buf[SD_FUSION_WINDOW];
  int count;
  int head;
} window_t;

static void window_push(window_t *w, const sd_imu_sample_t *s) {
  w->buf[w->head] = *s;
  w->head = (w->head + 1) % SD_FUSION_WINDOW;
  if (w->count < SD_FUSION_WINDOW) w->count++;
}

static sd_imu_sample_t window_avg(const window_t *w) {
  sd_imu_sample_t a;
  memset(&a, 0, sizeof(a));
  if (w->count == 0) return a;
  for (int i = 0; i < w->count; i++) {
    a.accel_x += w->buf[i].accel_x;
    a.accel_y += w->buf[i].accel_y;
    a.accel_z += w->buf[i].accel_z;
    a.gyro_x += w->buf[i].gyro_x;
    a.gyro_y += w->buf[i].gyro_y;
    a.gyro_z += w->buf[i].gyro_z;
  }
  const float n = (float)w->count;
  a.accel_x /= n; a.accel_y /= n; a.accel_z /= n;
  a.gyro_x /= n;  a.gyro_y /= n;  a.gyro_z /= n;
  a.ts_ms = w->buf[(w->head - 1 + SD_FUSION_WINDOW) % SD_FUSION_WINDOW].ts_ms;
  return a;
}

static void fusion_task(void *arg) {
  (void)arg;
  const TickType_t period = pdMS_TO_TICKS(1000 / SD_FUSION_HZ);
  TickType_t last = xTaskGetTickCount();
  window_t win = {.count = 0, .head = 0};

  for (;;) {
    sd_imu_sample_t imu;
    sd_shared_get_imu(&imu);
    window_push(&win, &imu);

    sd_fused_sample_t fused;
    fused.imu = window_avg(&win);
    sd_shared_get_gps(&fused.gps);
    fused.ts_ms = esp_timer_get_time() / 1000;

    // não bloqueia: se o consumidor estiver atrasado, descarta a amostra mais antiga
    if (xQueueSend(sd_fused_queue, &fused, 0) != pdTRUE) {
      sd_fused_sample_t drop;
      xQueueReceive(sd_fused_queue, &drop, 0);
      xQueueSend(sd_fused_queue, &fused, 0);
    }
    vTaskDelayUntil(&last, period);
  }
}

void sensor_fusion_start(void) {
  xTaskCreate(fusion_task, "sensor_fusion", 3072, NULL, 5, NULL);
}
