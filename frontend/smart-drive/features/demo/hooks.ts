'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { startDemo, resetDemo, fetchCurrentDemo, type DemoStartInput } from '@/lib/api'

export const demoKey = ['demo'] as const
export const demoCurrentKey = ['demo', 'current'] as const

/** Estado da sessão demo corrente. */
export function useDemoSession() {
  return useQuery({
    queryKey: demoCurrentKey,
    queryFn: ({ signal }) => fetchCurrentDemo({ signal }),
  })
}

/** Inicia a sessão demo; invalida o estado corrente ao concluir. */
export function useStartDemo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: DemoStartInput) => startDemo(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: demoKey }),
  })
}

/** Reseta a sessão demo (idempotente); invalida o estado corrente ao concluir. */
export function useResetDemo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => resetDemo(),
    onSuccess: () => qc.invalidateQueries({ queryKey: demoKey }),
  })
}
