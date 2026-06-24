import type { Device } from '@/features/shared/types'
import { api } from './client'

// Contrato do módulo de Dispositivos (PED — pareamento ESP32). Enquanto o backend
// real do Pedro não existe, estes caminhos são atendidos pelos handlers MSW de dev
// (features/devices/mocks). Ver docs/bloqueios-equipe-001.xml.
const DEVICES_PATH = '/api/devices'

export interface CreateDeviceInput {
  name: string
  deviceCode: string
  firmwareVersion?: string
  vehicleId: string
}

/** Lista os dispositivos do usuário autenticado. */
export function fetchDevices(options?: { signal?: AbortSignal }): Promise<Device[]> {
  return api.get<Device[]>(DEVICES_PATH, { signal: options?.signal })
}

/** Cadastra um dispositivo e já vincula ao veículo escolhido. */
export function createDevice(input: CreateDeviceInput): Promise<Device> {
  return api.post<Device>(DEVICES_PATH, input)
}

/** Busca um dispositivo por id. */
export function fetchDevice(id: string, options?: { signal?: AbortSignal }): Promise<Device> {
  return api.get<Device>(`${DEVICES_PATH}/${id}`, { signal: options?.signal })
}

/** Vincula um dispositivo a um veículo (pareamento). */
export function pairDevice(id: string, vehicleId: string): Promise<Device> {
  return api.patch<Device>(`${DEVICES_PATH}/${id}/pair`, { vehicleId })
}
