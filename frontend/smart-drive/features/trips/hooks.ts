'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchTrips, fetchTripSummary, fetchTripRoute } from '@/lib/api'

export const tripsKey = ['trips'] as const
export const tripSummaryKey = (id: string) => ['trips', id, 'summary'] as const
export const tripRouteKey = (id: string) => ['trips', id, 'route'] as const

/** Histórico de viagens (para escolher a viagem do relatório). */
export function useTrips() {
  return useQuery({ queryKey: tripsKey, queryFn: ({ signal }) => fetchTrips({ signal }) })
}

/** Resumo de uma viagem; só dispara quando há tripId. */
export function useTripSummary(tripId: string | null | undefined) {
  return useQuery({
    queryKey: tripSummaryKey(tripId ?? ''),
    queryFn: ({ signal }) => fetchTripSummary(tripId as string, { signal }),
    enabled: !!tripId,
  })
}

/** Trajeto de uma viagem; só dispara quando há tripId. */
export function useTripRoute(tripId: string | null | undefined) {
  return useQuery({
    queryKey: tripRouteKey(tripId ?? ''),
    queryFn: ({ signal }) => fetchTripRoute(tripId as string, { signal }),
    enabled: !!tripId,
  })
}
