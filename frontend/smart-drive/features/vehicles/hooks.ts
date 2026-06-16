'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  updateVehicle,
  type CreateVehicleInput,
  type UpdateVehicleInput,
} from '@/lib/api'

export const vehiclesKey = ['vehicles'] as const

/** Lista reativa de veículos do usuário (JOA-RF-01: aparece no dashboard após criar). */
export function useVehicles() {
  return useQuery({
    queryKey: vehiclesKey,
    queryFn: ({ signal }) => fetchVehicles({ signal }),
  })
}

/**
 * Cria um veículo e invalida a lista — a UI atualiza imediatamente após o sucesso
 * (JOA-RF-01: "veículo criado deve aparecer na listagem").
 */
export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVehicleInput) => createVehicle(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehiclesKey }),
  })
}

/**
 * Edita um veículo e invalida a lista (JOA-RF-02: "UI deve atualizar imediatamente
 * após salvar com sucesso").
 */
export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVehicleInput }) =>
      updateVehicle(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehiclesKey }),
  })
}

/** Remove um veículo e invalida a lista. */
export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehiclesKey }),
  })
}
