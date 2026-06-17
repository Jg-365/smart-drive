# Arquitetura na Nuvem — SmartDrive (ADR-001)

**Status:** proposto (2026-06-17) · **Decisão de:** João (integração) · **Requer alinhamento:** Pedro, Nathan
**Relacionado:** `docs/bloqueios-equipe-001.xml`, `docs/CLAUDE.json` (contrato de telemetria v1.0)

## Contexto

Hoje a ESP32 só funciona se enxergar a **LAN do backend** (`POST http://<ip-local>:3001/telemetry`).
Isso amarra a demo ao notebook e à rede local. A meta é um sistema **portátil e desacoplado**: o
backend e o banco vão para a **nuvem**, e o frontend vira **PWA** no celular (Wi-Fi ou dados móveis).
A ESP32 deve "cuspir" a telemetria assim que tiver internet, sem depender de estar na mesma rede de quem
visualiza.

## Decisão

**Caminho A — ESP32 → Wi-Fi (hotspot do celular ou qualquer AP com internet) → backend na nuvem; PWA lê da nuvem (WebSocket).**

```
┌────────┐  Wi-Fi (hotspot/AP)   ┌──────────────────────┐   WSS/HTTPS   ┌──────────────────┐
│ ESP32  │ ── HTTPS POST ──────▶ │  Backend NestJS       │ ───────────▶ │  PWA (celular)   │
│ +IMU   │   /api/telemetry      │  (nuvem) + Postgres   │   telemetry  │  Wi-Fi/dados     │
│ +GPS   │   contrato v1.0       │  gerenciado + WS GW   │   :new       │  iOS + Android   │
└────────┘                       └──────────────────────┘              └──────────────────┘
```

A ESP só precisa de **internet** (não da LAN de ninguém). O celular acompanha pela **nuvem** — pode até
não estar perto da ESP. Se a internet vier do **hotspot do celular**, o conjunto fica 100% portátil.

### Por que não Bluetooth (BLE)

BLE (ESP → celular → nuvem) também desacopla, mas **Web Bluetooth não funciona no iOS/Safari** — mataria
a PWA no iPhone (só Android/Chrome) e exigiria reescrever o `net_client` inteiro para BLE GATT.
**Rejeitado** enquanto o alvo for PWA cross-platform. Reconsiderar só se virar Android-only/app nativo.

## Mudanças por camada

### Firmware (foco desta frente — João)
O código de envio já existe (`net_client.c`, `esp_http_client` + cJSON). As mudanças são pontuais:

1. **Endpoint na nuvem (HTTPS):** `SD_TELEMETRY_URL` passa a ser `https://<dominio-nuvem>/api/telemetry`
   (HTTPS, não HTTP local). Hoje é `http://192.168.0.10:3001/telemetry`.
2. **TLS no esp_http_client:** habilitar verificação de certificado via **bundle do ESP-IDF**
   (`CONFIG_MBEDTLS_CERTIFICATE_BUNDLE=y` no `sdkconfig` + `.crt_bundle_attach = esp_crt_bundle_attach`
   na config do client). Custo de heap do TLS ~40–50 KB — cabe (há ~190 KB livres na bancada).
3. **Autenticação do dispositivo:** o endpoint na nuvem **não pode ser aberto** (qualquer um postaria).
   A ESP envia um header de identidade do device, ex.: `Authorization: Bearer <SD_DEVICE_TOKEN>` ou
   `x-device-key: <chave>`. Novo `#define SD_DEVICE_TOKEN` no `sd_config.h` (placeholder, não commitar real).
4. **Wi-Fi = rede com internet:** `SD_WIFI_SSID`/`SD_WIFI_PASS` apontam pro **hotspot do celular** (ou
   qualquer AP). Pra demo, hardcoded como hoje; futuro: provisionamento (SmartConfig/BLE/Kconfig/NVS).
5. **Buffer offline:** `SD_OFFLINE_BUFFER` (hoje 32) cobre quedas curtas de conexão; avaliar aumentar
   p/ trechos sem sinal. (A fila já descarta o mais antigo sob pressão.)
6. **Bônus — resolve a dívida do timestamp:** com internet garantida, dá pra rodar **SNTP** no boot e
   carimbar `timestamp` em **epoch real** (hoje é tempo-desde-boot). Fecha a dívida documentada do
   firmware sem depender do backend carimbar.

> O **contrato de telemetria v1.0 não muda** (mesmo JSON). Muda o **transporte** (URL/TLS/auth do device)
> — ainda assim é mudança que cruza times (ver "Responsabilidades").

### Backend (Pedro + João)
- **Deploy na nuvem**: NestJS num PaaS (ex.: Railway/Render/Fly.io) + **Postgres gerenciado**.
- **HTTPS/WSS** (TLS terminado no provedor) e **CORS** liberado para o domínio da PWA.
- **Auth real (Pedro)**: JWT para usuários **e** token/API-key para **dispositivos** (o `POST /api/telemetry`
  passa a exigir credencial de device — fim do controller mock aberto do EPIC-04).
- **Env**: `DATABASE_URL` (Postgres da nuvem), `CORS_ORIGIN` (domínio da PWA), `PORT`, segredos JWT/device.
- Caminho do ingest: definir **`/api/telemetry`** definitivo (hoje o mock fica em `/telemetry` sem prefixo
  por causa do firmware gravado — na nuvem padronizar `/api/telemetry` e reflashar a ESP).

### Frontend (João)
- Virar **PWA**: `manifest` + **service worker** (Next 16 suporta) + ícones; shell offline básico.
- `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` apontam pro **domínio da nuvem** (WSS).
- Deploy da PWA (ex.: Vercel) com HTTPS — requisito pra "instalar" no celular e pra Service Worker.

## Segurança (novos requisitos por sair da LAN)
- **Tudo HTTPS/WSS** (sem texto puro na internet).
- **Endpoint de telemetria autenticado por device** (token/API-key) — senão vira porta aberta.
- **JWT** para o usuário na PWA (frente do Pedro; o frontend já tem auth store pronto p/ Bearer).
- Segredos (Wi-Fi, device token, DB) **fora do git** (placeholders no `sd_config.h`; env no PaaS).

## Responsabilidades
- **João**: firmware (URL/TLS/auth-device/SNTP), PWA (manifest+SW), parametrização de URLs, este ADR.
- **Pedro**: deploy backend+Postgres na nuvem, HTTPS/WSS/CORS, auth de usuário (JWT) **e de device**,
  endpoint de ingestão definitivo.
- **Nathan**: nada muda no contrato; score/consumo/eventos continuam via WS (agora pela nuvem).

## Decisões em aberto
- Provedor de nuvem (backend) e de Postgres — Pedro.
- Esquema de auth de **device** (Bearer estático vs API-key por device vs mTLS) — João+Pedro.
- Provisionamento de Wi-Fi da ESP (hardcode na demo vs SmartConfig/portal) — João.
- Política de buffer/perda offline em trechos sem sinal — time.

## Fases sugeridas
1. **PWA + URLs parametrizadas** (João, sem depender de ninguém) — já dá pra apontar pra qualquer backend.
2. **Backend na nuvem + Postgres + HTTPS/CORS** (Pedro) — sobe o ambiente.
3. **Auth de device + firmware (HTTPS/TLS/token/SNTP)** (João+Pedro) — ESP posta na nuvem com segurança.
4. **Hotspot do celular** como portadora de internet na demo móvel.

## Riscos
- **Web Bluetooth/iOS** (por isso BLE foi descartado) — não cair nessa armadilha depois.
- **TLS na ESP32**: custo de heap e validação de certificado (usar o cert bundle do IDF).
- **Latência/instabilidade de dados móveis**: o buffer offline mitiga, mas há perda possível.
- **Endpoint aberto**: NÃO subir o ingest sem auth de device.
