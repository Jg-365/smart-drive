'use client'

import { useEffect } from 'react'
import { io, type Socket } from 'socket.io-client'
import { fetchLiveTelemetry } from '@/lib/api'
import { WS_URL } from '@/lib/api/config'
import type {
  DeviceStatus,
  DrivingEvent,
  DrivingScore,
  FuelEstimate,
  TelemetryPoint,
} from '@/features/shared/types'
import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from './events'
import { useTelemetryStore } from './store'

export interface UseTelemetrySocketOptions {
  /** Viagem a assinar (subscribe:trip). Sem tripId, o socket não é criado. */
  tripId: string | null
  /** Override da URL do WebSocket (default: NEXT_PUBLIC_WS_URL). */
  url?: string
  /** Tentativas de reconexão antes de cair para polling. Default 5. */
  maxReconnectAttempts?: number
  /** Intervalo do polling de fallback, em ms. Default 2000. */
  pollingIntervalMs?: number
  /** Desliga a conexão sem desmontar o componente. Default true. */
  enabled?: boolean
}

/**
 * Mantém a conexão WebSocket de telemetria e alimenta o store Zustand.
 * Reconecta automaticamente; após `maxReconnectAttempts` falhas, cai para
 * polling HTTP via lib/api (JOA-RNF-01). O hook não causa re-render por ponto:
 * todo dado vai para o store, consumido por selectors atômicos.
 */
export function useTelemetrySocket({
  tripId,
  url = WS_URL,
  maxReconnectAttempts = 5,
  pollingIntervalMs = 2000,
  enabled = true,
}: UseTelemetrySocketOptions): void {
  useEffect(() => {
    if (!enabled || !tripId) return

    const store = useTelemetryStore.getState()
    store.setTrip(tripId)
    store.setConnection('connecting')

    let pollTimer: ReturnType<typeof setInterval> | null = null

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }

    const startPolling = () => {
      if (pollTimer) return
      useTelemetryStore.getState().setConnection('polling')
      const poll = async () => {
        try {
          const point = await fetchLiveTelemetry()
          useTelemetryStore.getState().ingestPoint(point)
        } catch {
          // mantém o polling; backend pode estar voltando
        }
      }
      void poll()
      pollTimer = setInterval(poll, pollingIntervalMs)
    }

    const socket: Socket = io(url, {
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 500,
      reconnectionDelayMax: 8000,
      transports: ['websocket'],
    })

    // ── ciclo de conexão ──────────────────────────────────────────────
    socket.on('connect', () => {
      stopPolling()
      const s = useTelemetryStore.getState()
      s.setConnection('live')
      socket.emit(WS_CLIENT_EVENTS.subscribeTrip, tripId)
    })
    socket.on('disconnect', () => {
      // só marca reconnecting se não estivermos já no fallback de polling
      if (useTelemetryStore.getState().connection !== 'polling') {
        useTelemetryStore.getState().setConnection('reconnecting')
      }
    })
    socket.io.on('reconnect_attempt', () => {
      if (useTelemetryStore.getState().connection !== 'polling') {
        useTelemetryStore.getState().setConnection('reconnecting')
      }
    })
    // esgotou as tentativas → fallback HTTP, sem parar de tentar reconectar
    socket.io.on('reconnect_failed', () => {
      startPolling()
      socket.connect()
    })

    // ── eventos de dados (server → client) ────────────────────────────
    socket.on(WS_SERVER_EVENTS.telemetryNew, (p: TelemetryPoint) =>
      useTelemetryStore.getState().ingestPoint(p),
    )
    socket.on(WS_SERVER_EVENTS.eventDetected, (e: DrivingEvent) =>
      useTelemetryStore.getState().addEvent(e),
    )
    socket.on(WS_SERVER_EVENTS.scoreUpdated, (s: DrivingScore) =>
      useTelemetryStore.getState().setScore(s),
    )
    socket.on(WS_SERVER_EVENTS.fuelEstimateUpdated, (f: FuelEstimate) =>
      useTelemetryStore.getState().setFuelEstimate(f),
    )
    socket.on(WS_SERVER_EVENTS.deviceStatusChanged, (d: DeviceStatus) =>
      useTelemetryStore.getState().setDeviceStatus(d),
    )
    socket.on(WS_SERVER_EVENTS.tripFinished, () =>
      useTelemetryStore.getState().markFinished(),
    )

    return () => {
      stopPolling()
      if (socket.connected) socket.emit(WS_CLIENT_EVENTS.unsubscribeTrip, tripId)
      socket.removeAllListeners()
      socket.io.off('reconnect_attempt')
      socket.io.off('reconnect_failed')
      socket.disconnect()
      useTelemetryStore.getState().setConnection('offline')
    }
  }, [enabled, tripId, url, maxReconnectAttempts, pollingIntervalMs])
}
