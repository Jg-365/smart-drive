// SmartDrive ESP32 — leitor de IMU (MPU6050 via I2C). JOA-TEC-02.
#pragma once
#include <stdbool.h>

// Inicializa o barramento I2C e acorda o MPU6050. Retorna false em falha.
bool imu_reader_init(void);

// Sobe a task imu_reader (SD_IMU_HZ). Publica em sd_shared_set_imu().
void imu_reader_start(void);
