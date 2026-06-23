// SmartDrive ESP32 — configuração central (pinos, taxas, limiares, rede).
// JOA-TEC-02. Ajuste os valores conforme a placa/ambiente.
#pragma once

// ── Identidade do dispositivo (contrato de telemetria v1.0) ──────────────────
#define SD_DEVICE_ID   "esp32-demo-001"
#define SD_VEHICLE_ID  "vehicle-001"
#define SD_SESSION_ID  "demo-session-001" // pode ser sobrescrito em runtime

// ── Wi-Fi ────────────────────────────────────────────────────────────────────
// As credenciais NÃO ficam mais hardcoded: vêm do provisioning (SoftAP + captive
// portal) e são gravadas no NVS. Ver provisioning.h. O AP abaixo é o que o
// usuário acessa pelo celular na primeira configuração.
#define SD_PROV_AP_SSID "SmartDrive-Setup" // rede aberta que aparece no celular
#define SD_WIFI_MAX_RETRY 8                  // tentativas de STA antes de reabrir o portal

// ── Endpoint de ingestão (POST /telemetry) ──────────────────────────────────
// Nuvem (Cloud Run, HTTPS — exige o cert bundle anexado em net_client.c). Para
// backend local na LAN, troque por http://<IP-do-host>:3001/telemetry.
#define SD_TELEMETRY_URL "https://smartdrive-api-twfrfqngpa-rj.a.run.app/telemetry"
#define SD_HTTP_TIMEOUT_MS 8000 // TLS handshake + RTT até a nuvem: mais folga que na LAN

// ── I2C (acelerômetro/giroscópio MPU6050) ────────────────────────────────────
#define SD_I2C_PORT      0
#define SD_I2C_SDA_GPIO  19  // D19
#define SD_I2C_SCL_GPIO  21  // D21
#define SD_I2C_FREQ_HZ   400000
#define SD_MPU6050_ADDR  0x68

// ── UART (GPS NMEA, NEO-6M) ──────────────────────────────────────────────────
#define SD_GPS_UART      2
#define SD_GPS_RX_GPIO   16
#define SD_GPS_TX_GPIO   17
#define SD_GPS_BAUD      9600
#define SD_GPS_BUF_SIZE  2048

// ── Taxas das tasks (Hz) ─────────────────────────────────────────────────────
#define SD_IMU_HZ        50   // 20–50 Hz
#define SD_GPS_HZ        5    // 1–10 Hz
#define SD_FUSION_HZ     10
#define SD_EVENT_HZ      10
#define SD_NETWORK_HZ    2    // 1–5 Hz
#define SD_HEALTH_HZ     1

// ── Janela da média móvel da fusão (amostras) ────────────────────────────────
#define SD_FUSION_WINDOW 5

// ── Limiares de detecção de eventos (em g; 1 g ≈ 9.80665 m/s²) ───────────────
#define SD_G                 9.80665f
#define SD_TH_HARD_ACCEL_G   0.40f  // aceleração longitudinal +
#define SD_TH_HARD_BRAKE_G   0.45f  // desaceleração longitudinal -
#define SD_TH_SHARP_TURN_G   0.40f  // aceleração lateral |y|
#define SD_TH_IMPACT_G       2.50f  // magnitude total

// ── Buffer offline (registros) quando a rede falha ───────────────────────────
#define SD_OFFLINE_BUFFER 32
