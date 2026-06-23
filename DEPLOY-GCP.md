# Deploy SmartDrive na Google Cloud (Cloud Run + Cloud SQL)

Runbook de deploy do sistema completo: **backend NestJS** + **Postgres** + **PWA Next.js** na GCP.
Região padrão: **`southamerica-east1`** (São Paulo).

> **Segredos:** já existem valores reais gerados em `docs/deploy-secrets.local.md` (gitignored, não
> versionado). Use-os onde o runbook pedir `POSTGRES_PASSWORD`/`JWT_SECRET`, ou gere na hora com
> `openssl rand`. **Nunca** commite segredos.

## Pré-requisitos
- `gcloud` autenticado (`gcloud auth login`) e um projeto com billing.
- `cloud-sql-proxy` instalado (para rodar as migrations) — https://cloud.google.com/sql/docs/postgres/sql-proxy
- Os `Dockerfile`s deste repo (backend/frontend) e o `frontend/smart-drive/cloudbuild.yaml`.

## Variáveis da sessão
```bash
export PROJECT_ID=SEU_PROJECT_ID
export REGION=southamerica-east1
gcloud config set project "$PROJECT_ID"
export CSQL="$PROJECT_ID:$REGION:smartdrive-db"   # instance connection name
```

## 0. Habilitar APIs
```bash
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com
```

## 1. Postgres (Cloud SQL)
```bash
gcloud sql instances create smartdrive-db \
  --database-version=POSTGRES_16 --tier=db-f1-micro --region="$REGION"
gcloud sql databases create smartdrive --instance=smartdrive-db

# senha real (do cofre docs/deploy-secrets.local.md):
export DB_PW='COLE_O_POSTGRES_PASSWORD_DO_COFRE'
gcloud sql users set-password postgres --instance=smartdrive-db --password="$DB_PW"
```

## 2. Secret Manager (DATABASE_URL + JWT)
```bash
# DATABASE_URL via socket do Cloud SQL (note host=/cloudsql/<connection name>):
printf 'postgresql://postgres:%s@localhost/smartdrive?host=/cloudsql/%s' "$DB_PW" "$CSQL" \
  | gcloud secrets create database-url --data-file=-

# JWT real (do cofre) — ou gere: openssl rand -hex 32
printf '%s' 'COLE_O_JWT_SECRET_DO_COFRE' | gcloud secrets create jwt-secret --data-file=-
```

## 3. Backend → Cloud Run
Builda pelo `Dockerfile` em `backend/smart-drive/` e conecta no Cloud SQL via socket.
```bash
gcloud run deploy smartdrive-api \
  --source backend/smart-drive --region "$REGION" \
  --allow-unauthenticated \
  --add-cloudsql-instances "$CSQL" \
  --set-secrets 'DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest' \
  --set-env-vars 'NODE_ENV=production'
# anote: export API_URL=https://smartdrive-api-XXXX.run.app
```
Conceda ao service account do Cloud Run acesso aos secrets, se necessário:
```bash
PROJNUM=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
for S in database-url jwt-secret; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:${PROJNUM}-compute@developer.gserviceaccount.com" \
    --role=roles/secretmanager.secretAccessor
done
```

## 4. Migrations (uma vez, via proxy local)
```bash
cloud-sql-proxy "$CSQL" &           # abre socket/porta local 5432
cd backend/smart-drive
DATABASE_URL="postgresql://postgres:${DB_PW}@localhost:5432/smartdrive" npx prisma migrate deploy
cd ../..
# (opcional) seed: DATABASE_URL=... node seed-demo.cjs
```

## 5. Frontend (PWA) → Cloud Run
`NEXT_PUBLIC_*` é build-time → passe via `cloudbuild.yaml` + substitutions.
```bash
# repositório de imagens
gcloud artifacts repositories create smartdrive \
  --repository-format=docker --location="$REGION"

export WEB_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/smartdrive/web:latest"
gcloud builds submit frontend/smart-drive \
  --config frontend/smart-drive/cloudbuild.yaml \
  --substitutions="_API_URL=$API_URL,_WS_URL=$API_URL,_IMAGE=$WEB_IMAGE"

gcloud run deploy smartdrive-web \
  --image "$WEB_IMAGE" --region "$REGION" --allow-unauthenticated
# anote: export WEB_URL=https://smartdrive-web-XXXX.run.app
```

## 6. CORS (liberar a PWA no backend)
```bash
gcloud run services update smartdrive-api --region "$REGION" \
  --update-env-vars "CORS_ORIGIN=$WEB_URL"
```

## 7. Firmware → nuvem (quando reflashar a ESP32)
Em `firmware/main/include/sd_config.h`:
- `SD_TELEMETRY_URL` → `https://<API_URL>/api/telemetry`
- TLS via cert bundle do ESP-IDF (`CONFIG_MBEDTLS_CERTIFICATE_BUNDLE=y` + `.crt_bundle_attach`)
- header de device (`SD_DEVICE_TOKEN`) — não commitar valor real

## Verificação
- [ ] `curl https://$API_URL/api` responde (backend no ar).
- [ ] `POST https://$API_URL/api/auth/login` autentica.
- [ ] PWA abre em `$WEB_URL`, instala (manifest/SW) e conecta no backend (sem erro de CORS).
- [ ] Dashboard recebe telemetria via WSS.

## Notas
- WebSocket no Cloud Run: já suportado; se houver múltiplas instâncias, habilite session affinity
  (`gcloud run services update smartdrive-api --session-affinity`).
- Custo: `db-f1-micro` + Cloud Run scale-to-zero é barato para demo. Desligue a instância SQL fora da
  apresentação (`gcloud sql instances patch smartdrive-db --activation-policy=NEVER`) para economizar.
