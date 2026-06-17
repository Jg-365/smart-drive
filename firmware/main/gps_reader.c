#include "gps_reader.h"
#include "sd_config.h"
#include "sd_shared.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/uart.h"
#include "esp_log.h"
#include "esp_timer.h"
#include <string.h>
#include <stdlib.h>

static const char *TAG = "gps_reader";

bool gps_reader_init(void) {
  const uart_config_t cfg = {
      .baud_rate = SD_GPS_BAUD,
      .data_bits = UART_DATA_8_BITS,
      .parity = UART_PARITY_DISABLE,
      .stop_bits = UART_STOP_BITS_1,
      .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
      .source_clk = UART_SCLK_DEFAULT,
  };
  if (uart_param_config(SD_GPS_UART, &cfg) != ESP_OK) return false;
  if (uart_set_pin(SD_GPS_UART, SD_GPS_TX_GPIO, SD_GPS_RX_GPIO,
                   UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE) != ESP_OK)
    return false;
  if (uart_driver_install(SD_GPS_UART, SD_GPS_BUF_SIZE, 0, 0, NULL, 0) != ESP_OK)
    return false;
  return true;
}

// Converte "ddmm.mmmm" + hemisfério em graus decimais.
static double nmea_to_deg(const char *field, char hemi) {
  if (!field || !*field) return 0.0;
  double v = atof(field);
  int deg = (int)(v / 100);
  double min = v - deg * 100;
  double dec = deg + min / 60.0;
  if (hemi == 'S' || hemi == 'W') dec = -dec;
  return dec;
}

// Divide a sentença em até `max` campos (separador ','), in-place.
static int split_fields(char *s, char **out, int max) {
  int n = 0;
  char *p = s;
  out[n++] = p;
  while (*p && n < max) {
    if (*p == ',') {
      *p = '\0';
      out[n++] = p + 1;
    }
    p++;
  }
  return n;
}

// Parse de uma sentença NMEA, atualizando o fix. Trata GGA (posição) e RMC (velocidade).
static void parse_sentence(char *line, sd_gps_fix_t *fix) {
  char *f[20];
  int n = split_fields(line, f, 20);
  if (n < 1) return;

  if (strstr(f[0], "GGA") && n >= 9) {
    int quality = atoi(f[6]);
    if (quality > 0 && *f[2] && *f[4]) {
      fix->has_fix = true;
      fix->lat = nmea_to_deg(f[2], f[3][0]);
      fix->lng = nmea_to_deg(f[4], f[5][0]);
      fix->satellites = atoi(f[7]);
      fix->hdop = (float)atof(f[8]);
    } else {
      fix->has_fix = false;
    }
  } else if (strstr(f[0], "RMC") && n >= 8) {
    if (f[7] && *f[7]) {
      fix->speed_kmh = (float)atof(f[7]) * 1.852f; // nós → km/h
    }
  }
}

static void gps_task(void *arg) {
  (void)arg;
  static char line[128];
  size_t idx = 0;
  uint8_t byte;
  sd_gps_fix_t fix = {.has_fix = false};

  for (;;) {
    int len = uart_read_bytes(SD_GPS_UART, &byte, 1, pdMS_TO_TICKS(1000));
    if (len <= 0) continue;

    if (byte == '\n' || byte == '\r') {
      if (idx > 0) {
        line[idx] = '\0';
        if (line[0] == '$') {
          parse_sentence(line, &fix);
          fix.ts_ms = esp_timer_get_time() / 1000;
          sd_shared_set_gps(&fix);
        }
        idx = 0;
      }
    } else if (idx < sizeof(line) - 1) {
      line[idx++] = (char)byte;
    } else {
      idx = 0; // linha muito longa — descarta
    }
  }
}

void gps_reader_start(void) {
  ESP_LOGI(TAG, "GPS na UART%d (%d baud)", SD_GPS_UART, SD_GPS_BAUD);
  xTaskCreate(gps_task, "gps_reader", 3072, NULL, 5, NULL);
}
