'use client'

import type { ReactNode } from 'react'
import { useTelemetrySocket, type UseTelemetrySocketOptions } from './useTelemetrySocket'

export interface TelemetryProviderProps
  extends Omit<UseTelemetrySocketOptions, 'tripId'> {
  tripId: string | null
  children: ReactNode
}

/**
 * Sobe a conexão de telemetria uma única vez na árvore e renderiza os filhos.
 * Não assina o store, então novos pontos NÃO re-renderizam o provider nem a
 * subárvore — os consumidores leem via selectors do store (JOA-RNF-01).
 */
export function TelemetryProvider({ children, ...options }: TelemetryProviderProps) {
  useTelemetrySocket(options)
  return <>{children}</>
}
