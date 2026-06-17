// SmartDrive ESP32 — leitor de GPS NMEA (NEO-6M via UART). JOA-TEC-02.
#pragma once
#include <stdbool.h>

// Inicializa a UART do GPS. Retorna false em falha.
bool gps_reader_init(void);

// Sobe a task gps_reader. Publica em sd_shared_set_gps() (has_fix=false sem sinal).
void gps_reader_start(void);
