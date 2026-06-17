// SmartDrive ESP32 — detecção de eventos de condução a partir do IMU fundido.
// JOA-TEC-02.
#pragma once
#include "sd_types.h"

// Avalia limiares de aceleração/frenagem/curva/impacto numa amostra fundida.
// Função pura (testável isoladamente) — não depende de FreeRTOS.
sd_event_flags_t event_detector_eval(const sd_fused_sample_t *f);

// Sobe a task: lê sd_fused_queue, detecta eventos, empurra sd_record_queue.
void event_detector_start(void);
