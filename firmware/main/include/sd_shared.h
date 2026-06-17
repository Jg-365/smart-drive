// SmartDrive ESP32 — estado compartilhado protegido por mutex + filas do pipeline.
// imu_reader/gps_reader publicam a última amostra; a fusão lê. JOA-TEC-02.
#pragma once

#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "sd_types.h"

// fusão → event_detector
extern QueueHandle_t sd_fused_queue;
// event_detector → net_client
extern QueueHandle_t sd_record_queue;

// Cria mutex e filas. Retorna false se faltar memória.
bool sd_shared_init(void);

void sd_shared_set_imu(const sd_imu_sample_t *s);
void sd_shared_get_imu(sd_imu_sample_t *out);

void sd_shared_set_gps(const sd_gps_fix_t *s);
void sd_shared_get_gps(sd_gps_fix_t *out);
