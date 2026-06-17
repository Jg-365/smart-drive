#!/usr/bin/env bash
# SmartDrive — derruba o ambiente de desenvolvimento (JOA-RNF-02).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "▶ Derrubando Postgres (docker compose)…"
( cd "$ROOT/backend/docker" && docker compose down )

echo "✅ Ambiente derrubado. (O volume de dados do Postgres é preservado.)"
