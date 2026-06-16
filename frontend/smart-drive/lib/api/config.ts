// Base URLs da camada de dados. Lidos de variáveis públicas do Next
// (NEXT_PUBLIC_*), inlinadas no bundle em build. Ver frontend/.env.example.
//
// Em testes (vitest/jsdom) as envs não existem → fallback para string vazia,
// o que torna os caminhos relativos (ex: "/api/telemetry/live") e deixa o MSW
// interceptá-los pela rota, independente da origem.

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? ''
