# SmartDrive — Firmware ESP32 (JOA-TEC-02)

Firmware ESP-IDF/FreeRTOS que coleta telemetria (IMU + GPS), detecta eventos de
condução e envia o **contrato de telemetria v1.0** via `POST /telemetry`.

## Arquitetura (tasks FreeRTOS)

```
imu_reader (50 Hz, I2C MPU6050) ─┐
                                 ├─► sensor_fusion (10 Hz, média móvel) ─► event_detector (10 Hz) ─► net_client (POST 2 Hz)
gps_reader (NMEA, UART) ─────────┘
health_monitor (1 Hz)  → heap/uptime
```

- **imu_reader** — lê accel/gyro do MPU6050 por I2C e publica a última amostra.
- **gps_reader** — parseia sentenças NMEA (GGA/RMC) da UART; `has_fix=false` sem sinal.
- **sensor_fusion** — média móvel das amostras do IMU + último fix de GPS → fila.
- **event_detector** — limiares de aceleração/frenagem/curva/impacto (`event_detector_eval`, função pura).
- **net_client** — Wi-Fi STA + serializa o contrato v1.0 (cJSON) e faz `POST /telemetry`; drena para a amostra mais recente.
- **health_monitor** — loga heap livre/uptime/nº de tasks.

Estado compartilhado (`sd_shared`) usa mutex para o último IMU/GPS e filas para o pipeline fusão→eventos→rede (descartam o mais antigo sob pressão, mantendo tempo real).

## Estrutura

```
firmware/
  CMakeLists.txt
  main/
    CMakeLists.txt         ← registra todos os fontes + REQUIRES
    main.c                 ← app_main: NVS, sensores, tasks, Wi-Fi
    sd_shared.c            ← mutex + filas
    imu_reader.c           ← driver I2C MPU6050
    gps_reader.c           ← parser NMEA UART
    sensor_fusion.c        ← média móvel
    event_detector.c       ← detecção de eventos
    net_client.c           ← Wi-Fi + HTTP POST (contrato v1.0)
    health_monitor.c       ← heap/uptime
    include/               ← headers (sd_config.h, sd_types.h, ...)
```

## Configuração

Ajuste `main/include/sd_config.h`:
- Wi-Fi: `SD_WIFI_SSID` / `SD_WIFI_PASS`.
- Endpoint: `SD_TELEMETRY_URL` (ex.: `http://<ip-backend>:3000/telemetry`).
- Identidade: `SD_DEVICE_ID` / `SD_VEHICLE_ID` / `SD_SESSION_ID`.
- Pinos I2C (`SD_I2C_SDA_GPIO`/`SCL`) e UART do GPS (`SD_GPS_RX/TX_GPIO`).
- Taxas das tasks e limiares de eventos (em g).

> Credenciais estão em `sd_config.h` por simplicidade acadêmica; **não commitar Wi-Fi real**.
> Em produção, migrar para `Kconfig.projbuild` / NVS.

## Build & flash (no ambiente ESP-IDF)

> Requer ESP-IDF **>= 5.0** instalado e o `export.sh` carregado. O ambiente deste
> repositório **não tem o toolchain**, então o `idf.py build` deve ser executado
> na máquina do João (com a ESP32 conectada). O código segue as APIs do ESP-IDF 5.x.

```bash
cd firmware
idf.py set-target esp32      # uma vez
idf.py build                 # critério do done_when (JOA-TEC-02)
idf.py -p /dev/ttyUSB0 flash monitor
```

## Contrato enviado (`POST /telemetry`, v1.0)

```json
{
  "deviceId": "esp32-demo-001",
  "vehicleId": "vehicle-001",
  "sessionId": "demo-session-001",
  "timestamp": 1718560000000,
  "gps": { "lat": null, "lng": null, "speedKmh": null, "satellites": null, "hdop": null },
  "imu": { "accelX": 0.01, "accelY": -0.02, "accelZ": 0.98, "gyroX": 0.1, "gyroY": 0.0, "gyroZ": -0.2 },
  "events": { "hardAcceleration": false, "hardBrake": false, "sharpTurn": false, "impactSuspected": false },
  "battery": { "voltage": null, "percentage": null }
}
```

GPS `null` é condição esperada em ambiente fechado (a fusão "congela" no último fix
válido e o backend aceita `null` sem erro).
