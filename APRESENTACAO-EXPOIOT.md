# SmartDrive — Roteiro de Apresentação ExpoIOT

Roteiro de ~6–8 min para demonstrar o SmartDrive (telemetria veicular + score de
condução + estimativa de consumo) com o carrinho RC/ESP32 ou o fallback por simulador.

## Antes de começar (checklist de palco)

- [ ] `./scripts/dev-up.sh` (Postgres no ar) + backend (`npm run start:dev`) + frontend (`npm run dev`).
- [ ] ESP32 ligada e pareada **OU** `tools/telemetry-feeder` pronto como fallback.
- [ ] `NEXT_PUBLIC_DEV_TRIP_ID` apontando para a sessão demo.
- [ ] Tela em **tema dark** (default), navegador em tela cheia, http://localhost:3000.
- [ ] Plano B testado: se o GPS não pegar, a **pista virtual** assume sozinha.

## Roteiro

1. **Abertura (30s)** — O problema: dirigir bem economiza combustível e evita acidentes.
   O SmartDrive lê o comportamento do veículo (IMU + GPS) e dá um *score* + consumo estimado.

2. **A coleta (1 min)** — Mostrar a ESP32/carrinho. Firmware com FreeRTOS: lê acelerômetro (50 Hz)
   e GPS (NMEA), funde, detecta eventos (freada/curva/impacto) e envia o **contrato v1.0**
   por `POST /telemetry`. (Se sem hardware: "estamos usando o simulador, mesma interface.")

3. **Tempo real (2 min)** — Dashboard ao vivo: velocidade, aceleração, GPS, status online/offline,
   eventos aparecendo conforme a condução. Destacar: **sem refresh**, reconexão automática.

4. **Mapa (1 min)** — Trajeto em tempo real (MapLibre), marcadores de evento. Cobrir o GPS de
   propósito → "em ambiente fechado o GPS cai, mas a apresentação não para: **pista virtual**".

5. **Modo Demo / comparação (1–2 min)** — Iniciar demo (1 clique). Perfil SUAVE vs AGRESSIVA:
   o score cai e o consumo piora com direção agressiva — **modelo explicável**, não caixa-preta.
   Frisar a "estimativa honesta": número proporcional ao comportamento, não medição de tanque.

6. **Relatório (1 min)** — Encerrar e abrir o relatório: distância, duração, vel. média/máx,
   score final com classificação, consumo + confiança, lista de eventos e **recomendações**.

7. **Fechamento (30s)** — Stack TypeScript ponta a ponta (Next.js + NestJS + Postgres/Prisma +
   ESP-IDF), tempo real via WebSocket, tema dark/light, mobile-first. Trabalho em equipe (João,
   Nathan, Pedro). Próximos passos: app móvel nativo, mais sensores, histórico/gamificação.

## Perguntas prováveis (respostas curtas)

- *"Vocês medem o combustível real?"* — Não. Estimamos a partir do comportamento (IMU+GPS) e do
  consumo base do veículo, com fator de calibração por abastecimentos. É **explicável e honesto**.
- *"E se não tiver internet/GPS?"* — Telemetria bufferiza no dispositivo; GPS ausente → pista virtual.
- *"Tem IA?"* — No MVP é modelo determinístico (defensável e auditável); IA fica como evolução.
