# SmartDrive — Checklist de QA & ExpoIOT (JOA-TEC-04)

Checklist manual + evidência automatizada para validar as entregas antes da ExpoIOT.
Legenda: ✅ feito/automatizado · 🟡 parcial/depende de terceiros · ⏳ manual na bancada.

## 1. Evidência automatizada (rodável agora)

| Camada | Comando | Resultado |
|---|---|---|
| Frontend (unit/integração) | `cd frontend/smart-drive && npx vitest run` | ✅ 220 testes |
| Frontend (build) | `cd frontend/smart-drive && npm run build` | ✅ compila |
| Frontend (tipos) | `cd frontend/smart-drive && npx tsc --noEmit` | ✅ limpo |
| Backend (unit + integração c/ Postgres) | `cd backend/smart-drive && npm test -- --runInBand` | ✅ 57 testes |
| Banco | `cd backend/docker && docker compose up -d` + `npx prisma migrate deploy` | ✅ migra |
| Firmware | `cd firmware && idf.py build` | ⏳ validar na máquina com ESP-IDF (B02) |

> Testes de integração do backend rodam **serial** (`--runInBand`): em paralelo há corrida
> de dados no Postgres compartilhado (dívida conhecida).

## 2. SPECs JOA-TEC-04

- [ ] **Fluxo completo** ESP32/simulador → `POST /telemetry` → backend → WebSocket → dashboard
      🟡 Caminho coberto por partes: gateway WS testado (backend), store/dashboard testados (frontend).
      ⏳ End-to-end real: subir backend + frontend + (firmware **ou** `tools/telemetry-feeder`) e ver o
      dashboard atualizar ao vivo.
- [ ] **Modo demo com GPS ausente** ✅ lógica testada (geo ignora coord inválida; "GPS indisponível";
      pista virtual). ⏳ confirmar visualmente na demo.
- [ ] **Fallback sem hardware (simulador do Nathan)** 🟡 `tools/telemetry-feeder` injeta telemetria;
      integrar com o simulador oficial do Nathan (NAT-RF-07) quando disponível.
- [ ] **Relatório de viagem** ✅ testado com viagem simulada (mocks/summary). ⏳ validar com viagem real do Pedro.
- [ ] **Checklist de apresentação** ✅ este arquivo + `APRESENTACAO-EXPOIOT.md`.
- [ ] **Score e consumo do Nathan no dashboard** 🟡 UI pronta e testada; só preenche quando o caminho do
      Nathan emitir `trip:scoreUpdated`/`trip:fuelEstimateUpdated` (hoje o feeder só dispara `telemetry:new`).
- [ ] **Endpoints do Pedro respondem ao frontend** 🟡 frontend chama `/api/*` (vehicles/trips/demo);
      backend serve `/vehicles`,`/trips`,`/demo` SEM prefixo `api` e sem auth real — alinhar
      `setGlobalPrefix('api')` + JWT (ver dívidas).

## 3. Não-funcionais finais

- [ ] **RNF-03 mobile-first** — viewport 375px e áreas de toque 44×44px. 🟡 botões mortos resolvidos
      (EPIC-12); ⏳ medir alvos de toque na navbar/CTAs e ajustar se < 44px.
- [ ] **RNF-04 performance** — ✅ seletores atômicos + downsampling (500 pts) + cap de eventos.
- [ ] **RNF-05 portabilidade** — ✅ README + `scripts/dev-up.sh`/`dev-down.sh`. ⏳ rodar em outra
      máquina (Node 20+, Docker) do zero.

## 4. Dependências entre times (bloqueiam o "fechar")

- **Pedro**: auth JWT real (substituir `TempUserGuard`), `setGlobalPrefix('api')` (ou ajustar paths),
  endpoints reais de trips/devices, `POST /telemetry` real (substituir o controller mock do EPIC-04).
- **Nathan**: emitir `trip:scoreUpdated` / `trip:fuelEstimateUpdated` / `trip:eventDetected`; simulador NAT-RF-07.
- **João**: `idf.py build` do firmware + bancada (MPU6050 + NEO-6M); elevar o `tripId` da demo ao
  `TelemetryProvider` para a telemetria demo ao vivo fluir.

## 5. Roteiro rápido de smoke manual

1. `./scripts/dev-up.sh` → backend (`npm run start:dev`) → frontend (`npm run dev`).
2. Sem hardware: `cd tools/telemetry-feeder && node feed.mjs` e definir `NEXT_PUBLIC_DEV_TRIP_ID`.
3. Dashboard: velocidade/aceleração/GPS atualizam; tema dark default; alternar tema sem flicker.
4. Veículos: criar/editar/excluir (aparece na hora).
5. Modo demo: INICIAR (1 clique) → stage ao vivo; cobrir o GPS → pista virtual; RESET.
6. Relatório: abrir uma viagem encerrada (distância/duração/score/consumo/eventos/recomendações).
