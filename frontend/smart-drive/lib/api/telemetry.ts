import type { TelemetryPoint } from '@/features/shared/types'
import { api } from './client'

export interface Paginated<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
}

/**
 * Último ponto de telemetria processado. Usado como fallback de polling quando
 * o WebSocket cai e esgota as tentativas de reconexão (JOA-RNF-01).
 */
export function fetchLiveTelemetry(options?: { signal?: AbortSignal }): Promise<TelemetryPoint> {
  return api.get<TelemetryPoint>('/api/telemetry/live', { signal: options?.signal })
}

/** Histórico paginado de telemetria de uma viagem (replay / mapa). */
export function fetchTripTelemetry(
  tripId: string,
  params?: { page?: number; pageSize?: number },
  options?: { signal?: AbortSignal },
): Promise<Paginated<TelemetryPoint>> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  const query = qs.toString()
  return api.get<Paginated<TelemetryPoint>>(
    `/api/trips/${tripId}/telemetry${query ? `?${query}` : ''}`,
    { signal: options?.signal },
  )
}
