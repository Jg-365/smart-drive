'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchDevices } from '@/lib/api'

export const devicesKey = ['devices'] as const

/** Lista reativa de dispositivos do usuário. Enquanto o módulo do Pedro não
 * existe, é servida pelos handlers MSW de dev; em produção sem backend, o
 * `isError` aciona o estado "aguardando módulo de dispositivos". */
export function useDevices() {
  return useQuery({
    queryKey: devicesKey,
    queryFn: ({ signal }) => fetchDevices({ signal }),
  })
}
