# SmartDrive ExpoIOT

Monorepo do projeto SmartDrive (ESP32 + acelerômetro + GPS): firmware, backend (NestJS + Prisma)
e frontend (Next.js). Especificações e contratos em `docs/`.

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose (para o Postgres local)

## 1. Banco de dados (Postgres via Docker)

```bash
cd backend/docker
cp .env.example .env   # ajuste se quiser usuário/senha/porta diferentes
docker compose up -d
```

Isso sobe um Postgres 16 em `localhost:5432` com o banco `smartdrive`.

## 2. Backend (NestJS + Prisma)

```bash
cd backend/smart-drive
cp .env.example .env   # DATABASE_URL deve corresponder ao docker-compose acima
npm install
npx prisma migrate dev   # aplica as migrations no banco local
npm run start:dev        # http://localhost:3001
```

Rodar os testes (incluindo testes de integração contra o Postgres local):

```bash
npm test
```

## 3. Frontend (Next.js)

```bash
cd frontend/smart-drive
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3000
```

## Estrutura do monorepo

```
backend/
  docker/        # docker-compose.yml do Postgres local
  smart-drive/   # API NestJS + schema Prisma
firmware/         # firmware ESP-IDF (ESP32)
frontend/
  smart-drive/   # app Next.js
docs/             # specs, contratos e docs de sessão (ver docs/CLAUDE.json)
```
