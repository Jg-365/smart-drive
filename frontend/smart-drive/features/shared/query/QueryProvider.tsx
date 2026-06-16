'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/** Cria um QueryClient com defaults sensatos para a app (e reutilizável em testes). */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Estado de servidor muda pouco aqui (veículos); evita refetch agressivo.
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}

/**
 * Provider do TanStack Query para o estado de servidor (CRUD de veículos etc.).
 * O cliente vive em estado do componente para não ser recriado a cada render.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
