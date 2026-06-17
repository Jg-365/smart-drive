#!/usr/bin/env bash
# SmartDrive — sobe o ambiente de desenvolvimento (JOA-RNF-02).
# Sobe o Postgres (docker), aplica migrations e instrui backend/frontend.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "▶ Subindo Postgres (docker compose)…"
( cd "$ROOT/backend/docker" && docker compose up -d )

echo "▶ Aplicando migrations do Prisma…"
( cd "$ROOT/backend/smart-drive" && npx prisma migrate deploy )

cat <<EOF

✅ Banco no ar. Agora, em dois terminais:

  Backend:   cd backend/smart-drive && npm run start:dev
  Frontend:  cd frontend/smart-drive && npm run dev

Sem hardware/ESP32? Use o dataset/replay de fallback:
  cd tools/telemetry-feeder && node feed.mjs    # injeta telemetria via POST /telemetry

Dashboard: http://localhost:3000  (defina NEXT_PUBLIC_DEV_TRIP_ID p/ ver dados ao vivo)
EOF
