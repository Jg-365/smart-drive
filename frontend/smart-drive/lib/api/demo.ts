import type { FuelEstimate } from '@/features/shared/types'
import { api } from './client'

// Mesma convenção de prefixo /api/* (ver lib/api/vehicles.ts).
const DEMO_PATH = '/api/demo'

export type DemoProfile = 'smooth' | 'normal' | 'aggressive'

export interface DemoStartInput {
  scenario: DemoProfile
  /** Opcional: se ausente, o backend usa o veículo demo padrão (JOA-RF-05 edge). */
  vehicleId?: string
}

/** Sessão demo criada por POST /demo/start. */
export interface DemoSession {
  sessionId: string
  tripId: string
  scenario?: string
  startedAt?: string
}

/** Estado da sessão demo corrente (GET /demo/current). */
export interface DemoCurrent {
  sessionId: string
  tripId: string
  telemetryPointCount: number
  eventCount: number
  fuelEstimate?: FuelEstimate
}

/** Inicia uma sessão demo (1 chamada → "menos de 3 cliques"). */
export function startDemo(input: DemoStartInput): Promise<DemoSession> {
  return api.post<DemoSession>(`${DEMO_PATH}/start`, input)
}

/** Reseta a sessão demo corrente (idempotente — pode ser chamado várias vezes). */
export function resetDemo(): Promise<{ reset: boolean; sessionId: string }> {
  return api.post<{ reset: boolean; sessionId: string }>(`${DEMO_PATH}/reset`)
}

/** Lê o estado da sessão demo corrente. */
export function fetchCurrentDemo(options?: { signal?: AbortSignal }): Promise<DemoCurrent> {
  return api.get<DemoCurrent>(`${DEMO_PATH}/current`, { signal: options?.signal })
}
