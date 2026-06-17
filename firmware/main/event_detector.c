#include "event_detector.h"
#include "sd_config.h"
#include "sd_shared.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <math.h>

sd_event_flags_t event_detector_eval(const sd_fused_sample_t *f) {
  sd_event_flags_t e = {0};
  const float ax = f->imu.accel_x; // longitudinal (+ acelera / - freia)
  const float ay = f->imu.accel_y; // lateral (curva)
  const float az = f->imu.accel_z;

  e.hard_acceleration = ax > SD_TH_HARD_ACCEL_G;
  e.hard_brake = ax < -SD_TH_HARD_BRAKE_G;
  e.sharp_turn = fabsf(ay) > SD_TH_SHARP_TURN_G;

  // Magnitude total (inclui 1 g da gravidade em repouso) → impacto se muito alta.
  const float mag = sqrtf(ax * ax + ay * ay + az * az);
  e.impact_suspected = mag > SD_TH_IMPACT_G;
  return e;
}

static void event_task(void *arg) {
  (void)arg;
  sd_fused_sample_t fused;
  for (;;) {
    if (xQueueReceive(sd_fused_queue, &fused, portMAX_DELAY) == pdTRUE) {
      sd_telemetry_record_t rec = {
          .fused = fused,
          .events = event_detector_eval(&fused),
      };
      // descarta o mais antigo se a fila de envio estiver cheia (rede lenta)
      if (xQueueSend(sd_record_queue, &rec, 0) != pdTRUE) {
        sd_telemetry_record_t drop;
        xQueueReceive(sd_record_queue, &drop, 0);
        xQueueSend(sd_record_queue, &rec, 0);
      }
    }
  }
}

void event_detector_start(void) {
  xTaskCreate(event_task, "event_detector", 3072, NULL, 5, NULL);
}
