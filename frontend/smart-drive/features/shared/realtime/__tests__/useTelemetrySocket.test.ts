import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DeviceStatus,
  DrivingEventType,
  EventSeverity,
  ScoreClassification,
} from '@/features/shared/types'
import type {
  DrivingEvent,
  DrivingScore,
  FuelEstimate,
  TelemetryPoint,
} from '@/features/shared/types'
import { useTelemetryStore } from '../store'
import { useTelemetrySocket } from '../useTelemetrySocket'

// ── socket.io-client mockado: io() devolve um socket controlável ──────
const h = vi.hoisted(() => {
  function makeFakeSocket() {
    const handlers: Record<string, ((...a: unknown[]) => void)[]> = {}
    const ioHandlers: Record<string, ((...a: unknown[]) => void)[]> = {}
    const socket = {
      connected: false,
      emit: vi.fn(),
      connect: vi.fn(), // noop: testes disparam 'connect' manualmente
      disconnect: vi.fn(() => {
        socket.connected = false
      }),
      removeAllListeners: vi.fn(() => {
        for (const k of Object.keys(handlers)) delete handlers[k]
      }),
      on: vi.fn((ev: string, cb: (...a: unknown[]) => void) => {
        ;(handlers[ev] ??= []).push(cb)
        return socket
      }),
      io: {
        on: vi.fn((ev: string, cb: (...a: unknown[]) => void) => {
          ;(ioHandlers[ev] ??= []).push(cb)
        }),
        off: vi.fn((ev: string) => {
          delete ioHandlers[ev]
        }),
      },
      // helpers de teste: simulam mensagens recebidas
      __emit: (ev: string, ...args: unknown[]) =>
        (handlers[ev] ?? []).forEach((cb) => cb(...args)),
      __emitIo: (ev: string, ...args: unknown[]) =>
        (ioHandlers[ev] ?? []).forEach((cb) => cb(...args)),
    }
    return socket
  }
  let current: ReturnType<typeof makeFakeSocket> | undefined
  const ioMock = vi.fn(() => {
    current = makeFakeSocket()
    return current
  })
  return { ioMock, getSocket: () => current! }
})

vi.mock('socket.io-client', () => ({ io: h.ioMock }))
vi.mock('@/lib/api', () => ({ fetchLiveTelemetry: vi.fn() }))

import { fetchLiveTelemetry } from '@/lib/api'
const fetchLiveMock = vi.mocked(fetchLiveTelemetry)

// ── fixtures ──────────────────────────────────────────────────────────
const point: TelemetryPoint = {
  id: 'tp-1',
  tripId: 'trip-1',
  timestamp: 1_700_000_000_000,
  lat: -23.5,
  lng: -46.6,
  speedKmh: 42,
  accelX: 0.1,
  accelY: 0.2,
  accelZ: 9.8,
}
const event: DrivingEvent = {
  id: 'ev-1',
  tripId: 'trip-1',
  type: DrivingEventType.HARD_BRAKE,
  severity: EventSeverity.HIGH,
  timestamp: '2026-06-15T12:00:00Z',
  value: 7.2,
  threshold: 5,
  description: 'Freada brusca',
}
const score: DrivingScore = {
  value: 87,
  classification: ScoreClassification.GOOD,
  penalties: {
    hardAccelerations: 1,
    hardBrakes: 2,
    sharpTurns: 0,
    impactsSuspected: 0,
    speedInstability: 1,
  },
}
const fuel: FuelEstimate = {
  id: 'fe-1',
  tripId: 'trip-1',
  baseConsumptionKmL: 12,
  adjustedConsumptionKmL: 10.5,
  estimatedLitersSpent: 1.4,
  confidenceLevel: 0.8,
  modelVersion: 'v1',
}

beforeEach(() => {
  useTelemetryStore.getState().reset()
  vi.clearAllMocks()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useTelemetrySocket', () => {
  it('não cria socket sem tripId', () => {
    renderHook(() => useTelemetrySocket({ tripId: null }))
    expect(h.ioMock).not.toHaveBeenCalled()
  })

  it('ao conectar, marca live e assina a viagem (subscribe:trip)', () => {
    renderHook(() => useTelemetrySocket({ tripId: 'trip-1' }))
    const socket = h.getSocket()
    expect(useTelemetryStore.getState().connection).toBe('connecting')

    socket.connected = true
    socket.__emit('connect')

    expect(useTelemetryStore.getState().connection).toBe('live')
    expect(socket.emit).toHaveBeenCalledWith('subscribe:trip', 'trip-1')
  })

  it('mapeia cada evento server→client para o store', () => {
    renderHook(() => useTelemetrySocket({ tripId: 'trip-1' }))
    const socket = h.getSocket()

    socket.__emit('telemetry:new', point)
    socket.__emit('trip:eventDetected', event)
    socket.__emit('trip:scoreUpdated', score)
    socket.__emit('trip:fuelEstimateUpdated', fuel)
    socket.__emit('device:statusChanged', DeviceStatus.ONLINE)
    socket.__emit('trip:finished')

    const s = useTelemetryStore.getState()
    expect(s.lastPoint).toEqual(point)
    expect(s.events).toEqual([event])
    expect(s.score).toEqual(score)
    expect(s.fuelEstimate).toEqual(fuel)
    expect(s.deviceStatus).toBe(DeviceStatus.ONLINE)
    expect(s.tripFinished).toBe(true)
  })

  it('marca reconnecting ao cair e em cada tentativa', () => {
    renderHook(() => useTelemetrySocket({ tripId: 'trip-1' }))
    const socket = h.getSocket()

    socket.__emit('disconnect')
    expect(useTelemetryStore.getState().connection).toBe('reconnecting')

    socket.__emitIo('reconnect_attempt')
    expect(useTelemetryStore.getState().connection).toBe('reconnecting')
  })

  it('após esgotar as tentativas, cai para polling via lib/api', async () => {
    vi.useFakeTimers()
    fetchLiveMock.mockResolvedValue(point)

    renderHook(() => useTelemetrySocket({ tripId: 'trip-1', pollingIntervalMs: 2000 }))
    const socket = h.getSocket()

    socket.__emitIo('reconnect_failed')
    expect(useTelemetryStore.getState().connection).toBe('polling')

    // poll imediato + um ciclo do intervalo
    await vi.advanceTimersByTimeAsync(2000)

    expect(fetchLiveMock).toHaveBeenCalled()
    expect(useTelemetryStore.getState().lastPoint).toEqual(point)
  })

  it('limpa tudo no unmount (unsubscribe, disconnect, offline)', () => {
    const { unmount } = renderHook(() => useTelemetrySocket({ tripId: 'trip-1' }))
    const socket = h.getSocket()
    socket.connected = true

    unmount()

    expect(socket.emit).toHaveBeenCalledWith('unsubscribe:trip', 'trip-1')
    expect(socket.removeAllListeners).toHaveBeenCalled()
    expect(socket.disconnect).toHaveBeenCalled()
    expect(useTelemetryStore.getState().connection).toBe('offline')
  })
})
