// Base URLs da camada de dados. Lidos de variáveis públicas do Next
// (NEXT_PUBLIC_*), inlinadas no bundle em build. Ver frontend/.env.example.
//
// Em testes (vitest/jsdom) as envs não existem → fallback para string vazia,
// o que torna os caminhos relativos (ex: "/api/telemetry/live") e deixa o MSW
// interceptá-los pela rota, independente da origem.

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? ''

// Identidade de DEV enquanto o auth JWT do Pedro (PED-RF-02) não existe: casa com
// o header `x-user-id` do TempUserGuard do backend. Quando houver login real, o
// token JWT do auth store tem prioridade sobre isto (ver lib/api/client.ts).
export const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID ?? ''
