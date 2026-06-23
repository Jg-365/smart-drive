idf_component_register(
    SRCS
        "main.c"
        "sd_shared.c"
        "imu_reader.c"
        "gps_reader.c"
        "sensor_fusion.c"
        "event_detector.c"
        "net_client.c"
        "health_monitor.c"
    INCLUDE_DIRS "." "include"
    REQUIRES
        driver
        esp_driver_uart
        esp_timer
        nvs_flash
        esp_wifi
        esp_netif
        esp_event
        esp_http_client
        esp-tls
)
# cJSON entra via main/idf_component.yml (componente gerenciado espressif/cjson;
# o componente 'json' embutido foi removido no ESP-IDF 6.0).
