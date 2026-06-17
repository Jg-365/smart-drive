// SmartDrive ESP32 — Wi-Fi + envio HTTP do contrato de telemetria v1.0. JOA-TEC-02.
#pragma once
#include <stdbool.h>

// Conecta no Wi-Fi (STA). Bloqueia até obter IP ou esgotar tentativas.
bool net_client_wifi_connect(void);

// Sobe a task de rede (SD_NETWORK_HZ): drena sd_record_queue e faz POST /telemetry.
void net_client_start(void);
