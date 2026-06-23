# SmartDrive API (NestJS + Prisma 7 / adapter-pg) — imagem para Cloud Run.
# Prisma 7 com driver adapter (pg) não baixa engine binário, então node:20-slim basta.

# ── build ─────────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# ── runtime ───────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Cloud Run injeta PORT (8080); main.ts já faz listen(process.env.PORT ?? 3000).
ENV PORT=8080
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
EXPOSE 8080
# build do Nest (sourceRoot=src) emite o entrypoint em dist/src/main.js, não dist/main.
CMD ["node", "dist/src/main"]
