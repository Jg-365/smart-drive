#include "health_monitor.h"
#include "sd_config.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_heap_caps.h"
#include "esp_timer.h"

static const char *TAG = "health";

static void health_task(void *arg) {
  (void)arg;
  const TickType_t period = pdMS_TO_TICKS(1000 / SD_HEALTH_HZ);
  TickType_t last = xTaskGetTickCount();
  for (;;) {
    ESP_LOGI(TAG, "uptime=%llds heap_livre=%u min=%u tasks=%u",
             esp_timer_get_time() / 1000000,
             (unsigned)heap_caps_get_free_size(MALLOC_CAP_DEFAULT),
             (unsigned)heap_caps_get_minimum_free_size(MALLOC_CAP_DEFAULT),
             (unsigned)uxTaskGetNumberOfTasks());
    vTaskDelayUntil(&last, period);
  }
}

void health_monitor_start(void) {
  xTaskCreate(health_task, "health_monitor", 2560, NULL, 2, NULL);
}
