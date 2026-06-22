# Checklist de Portabilidade — SmartDrive (JOA-RNF-05)

Objetivo: garantir que o sistema (backend + frontend) sobe **do zero em outra máquina**
sem depender do ambiente específico de quem desenvolveu. Use esta lista ao clonar o repo
numa máquina nova (avaliador da ExpoIOT, outro integrante, CI).

## Pré-requisitos de toolchain

| Ferramenta | Versão | Como fixar |
|---|---|---|
| Node.js | **≥ 20** (LTS) | `.nvmrc` (raiz) → `nvm use`; `engines.node` nos `package.json` |
| npm | ≥ 10 (vem com Node 20+) | — |
| Docker + Docker Compose | qualquer recente | Postgres local |
| Git | qualquer | clonar o repo |

> Há `.nvmrc` na raiz: rode `nvm install && nvm use` antes de qualquer `npm`.
> Sem Node 20+, o Next 16 / React 19 / Prisma 7 podem falhar de formas obscuras.

## Sistema operacional

- **Linux / macOS:** suportados diretamente; `scripts/dev-up.sh` e `dev-down.sh` são bash.
- **Windows:** usar **WSL2** (os scripts `.sh` e o caminho de Docker assumem shell POSIX).
- Portas usadas: **5432** (Postgres), **3001** (backend), **3000** (frontend). Garanta que
  estejam livres ou ajuste via `.env`.

## Passo a passo (do zero)

```bash
# 0. Toolchain
nvm install && nvm use          # respeita o .nvmrc (Node 20)
node -v                          # confirmar >= 20

# 1. Banco (Postgres via Docker)
cd backend/docker && cp .env.example .env && docker compose up -d

# 2. Backend
cd ../smart-drive && cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev                # http://localhost:3001

# 3. Frontend (outro terminal)
cd frontend/smart-drive && cp .env.example .env.local
npm install
npm run dev                      # http://localhost:3000
```

Atalho (Linux/macOS): `scripts/dev-up.sh` sobe o Postgres + migrate; `scripts/dev-down.sh` derruba.

## Verificação (done_when do RNF-05)

- [ ] `node -v` ≥ 20 (via `.nvmrc`).
- [ ] `docker compose up -d` sobe o Postgres sem erro (`docker ps` mostra o container saudável).
- [ ] Backend: `npm install` limpo + `npx prisma migrate dev` aplica as migrations + `npm test` verde.
- [ ] Backend sobe em `:3001` e responde (ex.: `GET /api` ou rota de health).
- [ ] Frontend: `npm install` limpo + `npm run build` passa + `npm run dev` abre em `:3000`.
- [ ] Nenhum segredo real versionado (Wi-Fi/DB/JWT ficam em `.env`/placeholders — ver `sd_config.h`).
- [ ] `.env.example` de cada serviço cobre todas as variáveis necessárias (sem variável "fantasma").

## Armadilhas conhecidas

- **Node desatualizado** → erros de build do Next/Prisma. Solução: `nvm use`.
- **Porta 5432 ocupada** (Postgres do SO) → mude a porta no `backend/docker/.env` e no `DATABASE_URL`.
- **`DATABASE_URL` divergente** do docker-compose → backend não conecta. Os dois `.env` precisam casar.
- **Windows sem WSL** → scripts `.sh` não rodam; rode os comandos manualmente ou use WSL2.
- **Firmware:** credenciais de Wi-Fi e endpoint ficam em `firmware/main/include/sd_config.h` como
  placeholders (`CHANGE_ME_*`, IP de exemplo) — ajustar por bancada, **não** versionar valores reais.
