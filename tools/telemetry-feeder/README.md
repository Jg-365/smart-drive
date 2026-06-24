# Telemetry Feeder (dev)

Script de desenvolvimento que faz `POST /telemetry` em loop simulando uma direção,
para ver o **dashboard em tempo real** (EPIC-05) funcionando de ponta a ponta sem
ESP32 nem o simulador do Nathan. Exercita o caminho real:

```
feed.mjs → POST /telemetry → TelemetryGateway (EPIC-04) → WS telemetry:new → store → dashboard
```

## Como rodar

1. **Backend de pé** (porta 3001):
   ```bash
   cd backend/smart-drive && PORT=3001 npm run start:dev
   ```
2. **Frontend** assinando a mesma viagem:
   ```bash
   cd frontend/smart-drive && NEXT_PUBLIC_DEV_TRIP_ID=demo-session-001 npm run dev
   ```
3. **Feeder** noutro terminal:
   ```bash
   node tools/telemetry-feeder/feed.mjs
   ```

Abra o dashboard: velocidade, GPS, acelerômetro e status **LIVE** atualizam ao vivo.
Pare o feeder (Ctrl+C) e em ~5s o status vira **OFFLINE** (staleness). Religue e
ele volta a **LIVE** sozinho.

## Configuração (env)

| Var | Default | |
|---|---|---|
| `API_URL` | `http://localhost:3001` | URL do backend |
| `TRIP_ID` | `demo-session-001` | precisa casar com `NEXT_PUBLIC_DEV_TRIP_ID` |
| `HZ` | `5` | taxa de envio |
| `DEVICE_ID` / `VEHICLE_ID` | `esp32-demo-001` / `vehicle-001` | precisa casar com a seed/demo |

## Limitação

O `POST /telemetry` dispara `telemetry:new` e passa pelo orquestrador de análise do
backend. Quando os limiares são atingidos, o gateway também emite eventos, score e
estimativa de consumo para a PWA.
