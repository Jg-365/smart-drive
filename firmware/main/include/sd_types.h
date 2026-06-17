// SmartDrive ESP32 — tipos compartilhados entre as tasks. JOA-TEC-02.
#pragma once

#include <stdbool.h>
#include <stdint.h>

// Amostra bruta do IMU (em g para accel, °/s para gyro).
typedef struct {
  float accel_x, accel_y, accel_z;
  float gyro_x, gyro_y, gyro_z;
  int64_t ts_ms;
} sd_imu_sample_t;

// Fix de GPS. has_fix=false → lat/lng inválidos (ambiente fechado).
typedef struct {
  bool has_fix;
  double lat, lng;
  float speed_kmh;
  int satellites;
  float hdop;
  int64_t ts_ms;
} sd_gps_fix_t;

// Eventos de condução detectados a partir do IMU fundido.
typedef struct {
  bool hard_acceleration;
  bool hard_brake;
  bool sharp_turn;
  bool impact_suspected;
} sd_event_flags_t;

// Amostra fundida (IMU suavizado + último GPS) produzida a 10 Hz.
typedef struct {
  sd_imu_sample_t imu;   // já suavizado pela média móvel
  sd_gps_fix_t gps;      // último fix conhecido
  int64_t ts_ms;
} sd_fused_sample_t;

// Registro pronto para envio (fusão + eventos) — o que o net_client serializa.
typedef struct {
  sd_fused_sample_t fused;
  sd_event_flags_t events;
} sd_telemetry_record_t;
