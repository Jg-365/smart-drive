# SmartDrive — Checklist de QA & ExpoIOT (JOA-TEC-04)

Checklist manual + evidência automatizada para validar as entregas antes da ExpoIOT.
Legenda: ✅ feito/automatizado · 🟡 parcial/depende de terceiros · ⏳ manual na bancada.

## 1. Evidência automatizada (rodável agora)

| Camada | Comando | Resultado |
|---|---|---|
| Frontend (unit/integração) | `cd frontend/smart-drive && npx vitest run` | ✅ 247 testes |
| Frontend (build) | `cd frontend/smart-drive && npm run build` | ✅ compila |
| Frontend (tipos) | `cd frontend/smart-drive && npx tsc --noEmit` | ✅ limpo |
| Backend (unit sem banco, contratos novos) | `cd backend/smart-drive && npm test -- demo/demo.service.spec.ts telemetry/telemetry-query.service.spec.ts telemetry/dto/telemetry-payload.dto.spec.ts telemetry/analysis/input.mapper.spec.ts --runInBand` | ✅ 17 testes |
| Backend (build) | `cd backend/smart-drive && npm run build` | ✅ compila |
| Backend (integração c/ Postgres) | `cd backend/smart-drive && npm test -- --runInBand` | ⏳ exige Postgres local acessível |
| Banco | `cd backend/docker && docker compose up -d` + `npx prisma migrate deploy` | ✅ migra |
| Firmware | `. /home/joao/.espressif/v6.0.1/esp-idf/export.sh && idf.py -C firmware build` | ✅ buildou no ESP-IDF 6.0.1; app com 33% livre |

> Testes de integração do backend rodam **serial** (`--runInBand`): em paralelo há corrida
> de dados no Postgres compartilhado (dívida conhecida).

## 2. SPECs JOA-TEC-04

- [ ] **Fluxo completo** ESP32/simulador → `POST /telemetry` → backend → WebSocket → dashboard
      ✅ Contratos e build cobertos: ingestão real, demo endpoints, fallback polling e PWA.
      ⏳ Smoke manual: subir backend + frontend + (firmware **ou** `tools/telemetry-feeder`) e ver o
      dashboard atualizar ao vivo.
- [ ] **Modo demo com GPS ausente** ✅ lógica testada (geo ignora coord inválida; "GPS indisponível";
      pista virtual). ⏳ confirmar visualmente na demo.
- [ ] **Fallback sem hardware** ✅ `tools/telemetry-feeder` injeta telemetria no contrato real usando
      os IDs da demo (`demo-session-001`, `esp32-demo-001`, `vehicle-001`). ⏳ smoke manual no palco.
- [ ] **Relatório de viagem** ✅ testado com viagem simulada (mocks/summary). ⏳ validar com viagem real do Pedro.
- [ ] **Checklist de apresentação** ✅ este arquivo + `APRESENTACAO-EXPOIOT.md`.
- [ ] **Score e consumo do Nathan no dashboard** ✅ o caminho de ingestão chama o orquestrador e emite
      `trip:eventDetected`, `trip:scoreUpdated` e `trip:fuelEstimateUpdated` quando há telemetria.
- [ ] **Endpoints do frontend respondem no backend real** ✅ veículos, dispositivos, viagens, demo,
      telemetria live e histórico paginado estão alinhados ao prefixo `/api`.

## 3. Não-funcionais finais

- [ ] **RNF-03 mobile-first** — ✅ shell mobile único, tab bar persistente, menu real, veículos,
      dispositivos/parear e viagens restaurados no PWA. ⏳ smoke visual em 375px.
- [ ] **RNF-04 performance** — ✅ seletores atômicos + downsampling (500 pts) + cap de eventos.
- [ ] **RNF-05 portabilidade** — ✅ README + `scripts/dev-up.sh`/`dev-down.sh`. ⏳ rodar em outra
      máquina (Node 20+, Docker) do zero.

## 4. Dependências entre times (bloqueiam o "fechar")

- **Pedro**: endpoints reais de trips/devices/telemetry integrados. Auth JWT/login funcional; cadastro via
  `POST /api/users`. `x-user-id` continua como compatibilidade dev se habilitado.
- **Nathan**: orquestrador conectado à ingestão real para eventos, score e consumo. Simulador NAT-RF-07
  permanece evolução; fallback atual é `tools/telemetry-feeder`.
- **João**: ✅ firmware buildado com provisioning Wi-Fi. ⏳ flash/validação física da ESP em bancada.

## 5. Roteiro rápido de smoke manual

1. `./scripts/dev-up.sh` → backend (`npm run start:dev`) → frontend (`npm run dev`).
2. Sem hardware: frontend com `NEXT_PUBLIC_DEV_TRIP_ID=demo-session-001` e `node tools/telemetry-feeder/feed.mjs`.
3. Dashboard: velocidade/aceleração/GPS atualizam; tema dark default; alternar tema sem flicker.
4. Veículos: criar/editar/excluir (aparece na hora).
5. Modo demo: INICIAR (1 clique) → carrinho no mapa real ao vivo; sem fix → aviso honesto de GPS; RESET.
6. Viagens: INICIAR VIAGEM (seleção de veículo) → EM ANDAMENTO → ENCERRAR; abrir uma encerrada (relatório).
7. Dispositivos: lista de dispositivos (não veículos) com status + telemetria ao vivo.
8. Mapa (sidebar): posição real do GPS; SEGUIR VEÍCULO recentra.

## 6. Auditoria-001 — status dos critérios de aceite (CHK)

| CHK | Critério | Status |
|---|---|---|
| CHK-01 | Dashboard com dados reais / vazio honesto | ✅ FIX-04 (mapa real + cards do store) |
| CHK-02 | Mapa aprovado segue funcionando | ✅ smoke (tela Mapa + dashboard usam o mesmo LiveMap) |
| CHK-03 | Viagens iniciar/encerrar ou dependência clara | ✅ FIX-03 |
| CHK-04 | Veículos e Dispositivos separados por entidade | ✅ FIX-02 |
| CHK-05 | Demo não é mapa fake com retângulo verde | ✅ FIX-05 (carrinho no mapa real) |
| CHK-06 | Sem bolinhas piscantes decorativas fora de estado real | ✅ pulse só em estado real (online/live) |
| CHK-07 | Logo sem "TELEMETRY · v0.4.1" | ✅ FIX-06 |
| CHK-08 | Sem textos explicativos longos na UI principal | ✅ FIX-05 (demo) / 🟡 MobileDemoPage pendente |
| CHK-09 | Botões com ação, disabled ou feedback | ✅ FIX-02/03/04/06 |
| CHK-10 | Roteiro + fallback de demonstração | ✅ este checklist + contingência abaixo |

## 7. Contingência da demo (se hardware/rede/GPS falharem no palco)

Fallback **sem ESP32**, exercitando o caminho real (`POST /telemetry` → gateway → WS → dashboard):

```bash
# backend de pé (./scripts/dev-up.sh + npm run start:dev), depois:
TRIP_ID=demo-session-001 HZ=5 node tools/telemetry-feeder/feed.mjs
```

E o frontend com `NEXT_PUBLIC_DEV_TRIP_ID=demo-session-001`. O feeder simula uma direção crível
(velocidade, GPS andando, eventos esporádicos) — dashboard, mapa e demo atualizam ao vivo sem hardware.
Para dados gravados de verdade, use `tools/telemetry-recorder` (celular → CSV no contrato v1.0).
