#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/uart.h"
#include "esp_log.h"

#define GPS_UART UART_NUM_2

// Na sua placa:
// RX2 normalmente é GPIO16
// TX2 normalmente é GPIO17
#define GPS_RX_PIN 16
#define GPS_TX_PIN 17

#define GPS_BAUD_RATE 9600

static const char *TAG = "GPS_TEST";

void app_main(void)
{
    ESP_LOGI(TAG, "Iniciando teste do GPS NEO-6M...");

    uart_config_t uart_config = {
        .baud_rate = GPS_BAUD_RATE,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_DEFAULT,
    };

    ESP_ERROR_CHECK(uart_param_config(GPS_UART, &uart_config));

    ESP_ERROR_CHECK(uart_set_pin(
        GPS_UART,
        GPS_TX_PIN,              // TX da ESP32
        GPS_RX_PIN,              // RX da ESP32
        UART_PIN_NO_CHANGE,
        UART_PIN_NO_CHANGE
    ));

    ESP_ERROR_CHECK(uart_driver_install(
        GPS_UART,
        2048,
        0,
        0,
        NULL,
        0
    ));

    ESP_LOGI(TAG, "GPS configurado na UART2.");
    ESP_LOGI(TAG, "Aguardando frases NMEA...");

    uint8_t data[256];

    while (1) {
        int len = uart_read_bytes(
            GPS_UART,
            data,
            sizeof(data) - 1,
            pdMS_TO_TICKS(1000)
        );

        if (len > 0) {
            data[len] = '\0';
            printf("%s", (char *)data);
        } else {
            ESP_LOGW(TAG, "Nenhum dado recebido ainda...");
        }
    }
}