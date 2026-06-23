# SmartDrive PWA (Next.js 16, standalone) — imagem para Cloud Run.
# ATENÇÃO: NEXT_PUBLIC_* é inlinado em BUILD-TIME — as URLs do backend precisam
# entrar como --build-arg (ver cloudbuild.yaml / DEPLOY-GCP.md).

# ── build ─────────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
RUN npm run build

# ── runtime ───────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
# O servidor standalone respeita PORT/HOSTNAME; 0.0.0.0 é necessário no Cloud Run.
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 8080
CMD ["node", "server.js"]
