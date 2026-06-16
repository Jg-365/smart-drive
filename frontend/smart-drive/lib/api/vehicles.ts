import type { Vehicle } from '@/features/shared/types'
import { api } from './client'

// NOTA DE INTEGRAÇÃO: o backend (NestJS) expõe @Controller('vehicles') sem prefixo
// global, mas o frontend padroniza o prefixo /api/* (ver lib/api/telemetry.ts e os
// MSW handlers de veículos). Para a integração real, o backend precisará de
// app.setGlobalPrefix('api') OU este caminho deve cair para '/vehicles'. Mantido
// '/api/vehicles' para casar com os mocks/handlers e a convenção já existente.
const VEHICLES_PATH = '/api/vehicles'

/**
 * Campos aceitos na criação de um veículo. Espelha o CreateVehicleDto do backend
 * (JOA-RF-01) — id/ownerId/calibrationFactor/createdAt são definidos pelo servidor.
 */
export type CreateVehicleInput = Omit<
  Vehicle,
  'id' | 'ownerId' | 'calibrationFactor' | 'createdAt'
>

/** Atualização parcial (PATCH) — qualquer subconjunto dos campos editáveis. */
export type UpdateVehicleInput = Partial<CreateVehicleInput>

/** Lista os veículos do usuário autenticado. */
export function fetchVehicles(options?: { signal?: AbortSignal }): Promise<Vehicle[]> {
  return api.get<Vehicle[]>(VEHICLES_PATH, { signal: options?.signal })
}

/** Busca um veículo por id (404 se não existir ou for de outro usuário). */
export function fetchVehicle(id: string, options?: { signal?: AbortSignal }): Promise<Vehicle> {
  return api.get<Vehicle>(`${VEHICLES_PATH}/${id}`, { signal: options?.signal })
}

/** Cria um veículo; o servidor o associa ao usuário autenticado (JOA-RF-01). */
export function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  return api.post<Vehicle>(VEHICLES_PATH, input)
}

/** Atualiza só os campos enviados, preservando os demais (JOA-RF-02). */
export function updateVehicle(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
  return api.patch<Vehicle>(`${VEHICLES_PATH}/${id}`, input)
}

/** Remove (soft delete no backend) um veículo. */
export function deleteVehicle(id: string): Promise<void> {
  return api.delete<void>(`${VEHICLES_PATH}/${id}`)
}
