'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDevice, fetchDevices, pairDevice, type CreateDeviceInput } from '@/lib/api'

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

export function useCreateDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDeviceInput) => createDevice(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: devicesKey }),
  })
}

export function usePairDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, vehicleId }: { id: string; vehicleId: string }) => pairDevice(id, vehicleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: devicesKey }),
  })
}
