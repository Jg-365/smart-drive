# Plano de Fechamento TDD — SmartDrive ExpoIOT

> Criado em 2026-06-23 para guiar o fechamento do MVP da ExpoIOT.
> Apresentacao: 2026-06-24.

## Regra de Design System

Nao alterar o design system atual.

- Manter tokens de cor/fonte via `sdVars as SD` em `frontend/smart-drive/lib/sd-vars`.
- Manter icones via `Icon` em `frontend/smart-drive/features/shared/ui/icons`.
- Manter primitivos existentes (`Stat`, `Panel`, `Tag`, `Dot`, `Btn`) e classes utilitarias (`sd-display`, `sd-label`, `sd-mono`, `sd-btn`).
- Nao introduzir nova biblioteca visual, nova paleta, novo framework de componentes ou refatoracao estetica fora do necessario para responsividade/funcionalidade.
- Mudancas de UI devem preservar a linguagem visual atual e corrigir apenas fluxo, estado, responsividade e acoes falsas.

## Metodo Por Epico

Cada epico deve seguir o ciclo:

1. Registrar o problema e o criterio de aceite.
2. Escrever ou ajustar teste/verificacao que reproduz a falha.
3. Implementar o minimo necessario para passar.
4. Rodar teste alvo e suite relevante.
5. Refatorar apenas se reduzir risco ou duplicacao real.
6. Atualizar a secao "Progresso dos Epicos" neste documento.

Um epico so e considerado entregue quando os testes/verificacoes passam ou quando uma dependencia externa fica documentada com comando de fallback.

## Epico 0 — Baseline e Congelamento

Objetivo: estabelecer o estado confiavel antes de alterar codigo.

Escopo:
- Verificar `git status --short`.
- Rodar validacoes possiveis de frontend e backend.
- Separar falhas de sandbox/ambiente de falhas reais do codigo.

TDD/verificacoes:
- Frontend: `npm test`, `npx tsc --noEmit`, `npm run build`.
- Backend: `npm run build`.
- Backend tests quando houver Postgres acessivel.

Criterio de aceite:
- Baseline registrado.
- Falhas reais priorizadas.
- Nenhuma alteracao funcional feita neste epico.

## Epico 1 — Contratos Backend Quebrados

Objetivo: fechar o que quebra fluxo real fora de mocks.

Escopo:
- Implementar ou alinhar `/api/demo/start`, `/api/demo/reset`, `/api/demo/current`.
- Corrigir `POST /api/trips/start`: frontend envia `deviceId` ou backend aceita fallback controlado de dispositivo pareado.
- Implementar endpoints de fallback:
  - `GET /api/telemetry/live`
  - `GET /api/trips/:id/telemetry`

TDD/verificacoes:
- Testes backend para `/api/demo/*`.
- Teste de start de viagem com `vehicleId + deviceId`.
- Teste de ultimo ponto de telemetria.
- Testes frontend de cliente API alinhados ao contrato real.

Criterio de aceite:
- "INICIAR DEMO" nao falha por 404 no backend real.
- Viagem real inicia pela UI.
- Fallback por polling nao quebra quando WS cai.

## Epico 2 — PWA Mobile Shell Unico

Objetivo: corrigir navegacao, altura e tab bar mobile conforme handoff do Claude.

Escopo:
- `app/page.tsx`: usar `100dvh`, `mobileSub` e um unico `MobileShell`.
- `app/globals.css`: garantir `html, body { height: 100%; }`.
- Remover `MobileShell` interno das paginas mobile.
- `MapPage` nao deve esconder a tab bar.

TDD/verificacoes:
- Testes de navegacao mobile:
  - tab "Menu" abre hub, nao Demo.
  - tab bar permanece no Mapa.
  - sub-screen mantem voltar e tab bar.
- Typecheck e build.

Criterio de aceite:
- Barra inferior aparece em todas as telas mobile, inclusive Mapa.
- Conteudo nao fica cortado por `100vh`.
- Menu vira hub real.

## Epico 3 — Restaurar Features no Mobile

Objetivo: trazer para PWA/mobile features que hoje aparecem so no desktop.

Escopo:
- Criar `features/menu/components/MobileMenuPage.tsx`.
- Criar `features/menu/index.ts`.
- Menu com:
  - Modo Demo.
  - Meu veiculo.
  - Dispositivos / Parear.
  - Conta.
- Tornar `DevicesPage` responsiva.
- Extrair `PairingModal`.
- Tornar `VehiclesPage` responsiva.

TDD/verificacoes:
- Teste do menu abrindo cada sub-screen.
- Teste "Parear" visivel no mobile e abrindo modal `SmartDrive-Setup`.
- Teste/smoke de `VehiclesPage` no mobile.

Criterio de aceite:
- Usuario acessa pareamento/configuracao Wi-Fi pelo PWA.
- Usuario acessa cadastro/calibracao de veiculo no mobile.
- Desktop continua funcionando.

## Epico 4 — Viagens Mobile e Relatorio Sem 404

Objetivo: corrigir "falha em buscar relatorios" no PWA.

Escopo:
- Criar `MobileTripsPage`.
- Viagem ativa aparece como "EM ANDAMENTO" e leva para "Ao vivo".
- Apenas viagem `FINISHED` abre `MobileTripReportPage`.
- `MobileTripReportPage` passa a receber `tripId` explicito.

TDD/verificacoes:
- Teste: viagem ativa nao chama summary.
- Teste: viagem encerrada chama summary e route.
- Teste: loading/erro/vazio corretos.

Criterio de aceite:
- Tab Viagens nao quebra quando so existe trip ativa.
- Relatorio abre apenas para viagem encerrada.
- Estados sao honestos e diagnosticaveis.

## Epico 5 — Demo ExpoIOT End-to-End

Objetivo: garantir apresentacao mesmo sem hardware.

Escopo:
- Botao Demo cria/seleciona sessao valida.
- Feeder alinhado com seed:
  - `DEVICE_ID=esp32-demo-001`
  - `VEHICLE_ID=vehicle-001`
  - `TRIP_ID=demo-session-001`
- Comando unico de fallback documentado.
- Score, consumo e eventos chegam no store.

TDD/verificacoes:
- Backend test de demo criando trip ativa.
- Frontend test de `useStartDemo` setando `tripId`.
- Smoke do caminho real `POST /telemetry -> WS -> PWA`.

Criterio de aceite:
- Sem ESP32, apresentacao roda com caminho real.
- Demo nao depende de MSW.
- Fallback operacional esta documentado.

## Epico 6 — Firmware/Provisioning e Integracao Real

Objetivo: validar a parte embarcada e a integracao com nuvem/local.

Escopo:
- Conferir build firmware.
- Confirmar SoftAP/NVS/provisioning.
- Confirmar payload do firmware contra DTO.
- Confirmar seed/banco com device/vehicle/trip correspondentes.

TDD/verificacoes:
- Build firmware.
- Teste DTO backend aceita payload do firmware com GPS nulo.
- Teste rejeita device/vehicle incompatível.
- Smoke manual documentado para ESP.

Criterio de aceite:
- ESP32 pode configurar Wi-Fi sem reflash de credenciais.
- Telemetria real bate no backend.
- GPS ausente indoor nao derruba modo demo.

## Epico 7 — Hardening Final e Evidencia

Objetivo: consolidar PRD e deixar o sistema pronto para apresentar.

Escopo:
- Atualizar `QA-CHECKLIST.md`.
- Atualizar roteiro com comandos reais.
- Corrigir documentacao defasada dos handoffs.
- Rodar validacoes finais.

TDD/verificacoes:
- Frontend: tests, typecheck, build.
- Backend: build e testes possiveis.
- Smoke manual:
  - login.
  - dashboard.
  - demo.
  - mapa.
  - viagens.
  - veiculos.
  - dispositivos/parear.
  - mobile 375px.
  - desktop.

Criterio de aceite:
- Sistema demonstravel pelo fluxo real ou fallback.
- UI nao finge dado real.
- PRD MVP coberto: telemetria, mapa, eventos, score, consumo estimado, veiculos, demo, PWA mobile-first e documentacao.

## Ordem de Execucao

1. Epico 0 — Baseline e Congelamento.
2. Epico 1 — Contratos Backend Quebrados.
3. Epico 2 — PWA Mobile Shell Unico.
4. Epico 3 — Restaurar Features no Mobile.
5. Epico 4 — Viagens Mobile e Relatorio Sem 404.
6. Epico 5 — Demo ExpoIOT End-to-End.
7. Epico 6 — Firmware/Provisioning e Integracao Real.
8. Epico 7 — Hardening Final e Evidencia.

## Progresso dos Epicos

| Epico | Status | Evidencia | Pendencias |
|---|---|---|---|
| 0 — Baseline e Congelamento | Concluido | `git status --short`: apenas nao rastreados preexistentes (`backend/smart-drive/seed-demo.cjs`, `hardware/`, `tools/telemetry-recorder/`). Frontend `npm test`: 30 arquivos/241 testes ok. Frontend `npx tsc --noEmit`: ok. Frontend `npm run build`: ok com rede liberada para Google Fonts. Backend `npm run build`: ok. | Backend tests completos dependem de Postgres acessivel; nao rodados no baseline por ambiente/sandbox. |
| 1 — Contratos Backend Quebrados | Concluido | Backend: endpoints reais `/api/demo/start`, `/api/demo/reset`, `/api/demo/current`; `GET /api/telemetry/live`; `GET /api/trips/:id/telemetry`. Frontend: `TripsPage` envia `deviceId` do dispositivo pareado; `pairDevice` usa `PATCH`. Testes: frontend `npm test` 30 arquivos/244 testes ok; frontend `npx tsc --noEmit` ok; frontend `npm run build` ok; backend `npm run build` ok; backend specs `demo.service` e `telemetry-query.service` ok (6 testes). | Backend test completo ainda depende de Postgres acessivel para specs de integracao existentes. |
| 2 — PWA Mobile Shell Unico | Concluido | `app/page.tsx` usa `100dvh`, `mobileSub` e um unico `MobileShell`; paginas mobile viraram content-only; `MapPage` nao usa mais `hideBars`; `app/globals.css` define `html, body { height: 100%; }`. Testes focados de navegacao mobile passaram. | — |
| 3 — Restaurar Features no Mobile | Concluido | Criado `MobileMenuPage`; Menu abre sub-screens de Demo, Meu veiculo, Dispositivos/Parear e Conta; `DevicesPage` e `VehiclesPage` responsivas via `useIsMobile`; `PairingModal` extraido e reutilizavel. Testes focados de menu/devices/vehicles passaram. | — |
| 4 — Viagens Mobile e Relatorio Sem 404 | Concluido | Criado `MobileTripsPage`; viagem ativa navega para Ao vivo sem chamar summary; apenas `FINISHED` abre `MobileTripReportPage`; relatorio recebe `tripId` explicito. Testes focados passaram. Suite frontend completa: 32 arquivos/247 testes ok; `npx tsc --noEmit` ok; `npm run build` ok. | — |
| 5 — Demo ExpoIOT End-to-End | Concluido | Backend demo real implementado no Epico 1; feeder alinhado aos IDs da seed/firmware (`demo-session-001`, `esp32-demo-001`, `vehicle-001`); `tools/telemetry-feeder/README.md` e `frontend/smart-drive/.env.example` atualizados; demo mobile marca `demoMode` no store. Validacoes: frontend `npm test` 32 arquivos/247 testes ok; `npx tsc --noEmit` ok; frontend `npm run build` ok; backend `npm run build` ok; specs backend novos ok. | Smoke com backend rodando + banco seedado ainda deve ser feito no Epico 7 ou em bancada. |
| 6 — Firmware/Provisioning e Integracao Real | Concluido | Backend DTO aceita payload completo, GPS nulo e gyro ausente: `telemetry-payload.dto.spec.ts` + `input.mapper.spec.ts` passaram (11 testes). Firmware build ESP-IDF 6.0.1 passou com `idf.py -C firmware build`; binario `0xfc9f0`, particao app com `0x7a610` bytes livres (33%). Firmware inclui provisioning SoftAP/NVS, endpoint Cloud Run em `sd_config.h` e reset de Wi-Fi por botao BOOT/GPIO0 segurado por 3s. | Flash/validação física da ESP em porta serial fica para bancada. |
| 7 — Hardening Final e Evidencia | Concluido | `QA-CHECKLIST.md` e `APRESENTACAO-EXPOIOT.md` atualizados com comandos/status reais. Validacao final: frontend `npm test` 32 arquivos/247 testes ok; frontend `npx tsc --noEmit` ok; frontend `npm run build` ok; backend specs sem banco 4 suites/17 testes ok; backend `npm run build` ok; firmware `idf.py -C firmware build` ok. Hardening posterior: `POST /api/devices` reaproveita `deviceCode` ja existente para relinkar a ESP fisica ao veiculo do usuario, sem travar em 409 durante apresentacao; UI explica que o codigo deve bater com o firmware (`esp32-demo-001`). Validacoes focadas: backend `devices.service`, `demo.service`, `telemetry-query.service` ok (10 testes); frontend `DevicesPage`, `client`, `TripsPage` ok (16 testes); frontend typecheck/build ok; backend build ok. | Smoke manual com browser, banco seedado e/ou ESP fisica ainda deve ser feito em bancada/palco. Backend suite completa com integracao exige Postgres local acessivel. |

## Log de Atualizacoes

- 2026-06-23: Plano criado. Regra explicita: nao mudar o design system atual.
- 2026-06-23: Epico 0 concluido com baseline de frontend/backend. Proximo: Epico 1.
- 2026-06-23: Epico 1 concluido. Contratos de demo, telemetry polling, historico de telemetria, start de viagem e pair device alinhados.
- 2026-06-23: Epicos 2, 3 e 4 concluidos. PWA mobile agora usa shell unico, menu real, features de veiculos/dispositivos e viagens sem summary de trip ativa.
- 2026-06-23: Epico 5 concluido. Fallback sem hardware alinhado aos IDs reais da demo e documentado.
- 2026-06-23: Epico 6 concluido. Payload validado e firmware buildado com provisioning Wi-Fi.
- 2026-06-23: Epico 7 concluido. Checklist/roteiro atualizados e validacao final executada.
- 2026-06-23: Hardening de dispositivos aplicado. Cadastro agora relinka deviceCode existente e evita bloqueio por codigo duplicado na apresentacao; tela de dispositivos orienta usar o ID real gravado no firmware.
