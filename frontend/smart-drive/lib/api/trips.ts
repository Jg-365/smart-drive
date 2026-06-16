import type { Trip, DrivingEvent, FuelEstimate } from '@/features/shared/types'
import { api } from './client'

// Mesma convenção de prefixo /api/* do restante do frontend (ver lib/api/vehicles.ts).
const TRIPS_PATH = '/api/trips'

/** Resposta do resumo de viagem (GET /trips/:id/summary) — Pedro/Nathan (PED-RF-07/NAT-RF-04/05). */
export interface TripSummaryResponse {
  trip: Trip
  events: DrivingEvent[]
  fuelEstimate: FuelEstimate
}

/** Ponto de rota do replay (GET /trips/:id/route). */
export interface RoutePoint {
  lat: number
  lng: number
}

/** Histórico de viagens do usuário (para seleção/última viagem). */
export function fetchTrips(options?: { signal?: AbortSignal }): Promise<Trip[]> {
  return api.get<Trip[]>(TRIPS_PATH, { signal: options?.signal })
}

/** Resumo consolidado de uma viagem encerrada (distância/score/consumo/eventos). */
export function fetchTripSummary(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<TripSummaryResponse> {
  return api.get<TripSummaryResponse>(`${TRIPS_PATH}/${id}/summary`, { signal: options?.signal })
}

/** Trajeto (lista de coordenadas) da viagem, para mapa/resumo. */
export function fetchTripRoute(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<RoutePoint[]> {
  return api.get<RoutePoint[]>(`${TRIPS_PATH}/${id}/route`, { signal: options?.signal })
}
