import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DrivingEventType, EventSeverity } from '@/features/shared/types'
import type { DrivingEvent } from '@/features/shared/types'
import { MAX_EVENTS, MAX_SPEED_HISTORY, useDrivingScore, useTelemetryStore } from '../store'

const makeEvent = (id: string): DrivingEvent => ({
  id,
  tripId: 'trip-1',
  type: DrivingEventType.SHARP_TURN,
  severity: EventSeverity.LOW,
  timestamp: '2026-06-15T12:00:00Z',
  value: 1,
  threshold: 0.5,
  description: 'curva',
})

beforeEach(() => useTelemetryStore.getState().reset())

describe('telemetry store', () => {
  it('addEvent insere no topo e respeita o teto de MAX_EVENTS', () => {
    const { addEvent } = useTelemetryStore.getState()
    for (let i = 0; i < MAX_EVENTS + 10; i++) addEvent(makeEvent(`e${i}`))

    const { events } = useTelemetryStore.getState()
    expect(events).toHaveLength(MAX_EVENTS)
    // mais recente primeiro
    expect(events[0].id).toBe(`e${MAX_EVENTS + 9}`)
  })

  it('reset volta ao estado inicial', () => {
    const s = useTelemetryStore.getState()
    s.setConnection('live')
    s.ingestPoint({
      id: 'p',
      tripId: 't',
      timestamp: 1,
      lat: 0,
      lng: 0,
      speedKmh: 0,
      accelX: 0,
      accelY: 0,
      accelZ: 0,
    })
    s.reset()
    const r = useTelemetryStore.getState()
    expect(r.connection).toBe('offline')
    expect(r.lastPoint).toBeNull()
  })

  it('selector atômico não re-renderiza quando outra fatia muda (RNF-01)', () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders++
      return useDrivingScore()
    })
    expect(result.current).toBeNull()
    const before = renders

    // muda fatia NÃO assinada por este selector
    useTelemetryStore.getState().setConnection('live')
    useTelemetryStore.getState().ingestPoint({
      id: 'p',
      tripId: 't',
      timestamp: 1,
      lat: 0,
      lng: 0,
      speedKmh: 0,
      accelX: 0,
      accelY: 0,
      accelZ: 0,
    })

    expect(renders).toBe(before) // sem re-render
  })

  it('ingestPoint acumula a rota só com coordenadas válidas (JOA-RF-04)', () => {
    const s = useTelemetryStore.getState()
    const p = (lat: number | null, lng: number | null) => ({
      id: 'p', tripId: 't', timestamp: 1,
      lat: lat as number, lng: lng as number,
      speedKmh: 0, accelX: 0, accelY: 0, accelZ: 0,
    })
    s.ingestPoint(p(-23.5, -46.6))
    s.ingestPoint(p(null, null)) // GPS perdido — ignorado, marcador congela
    s.ingestPoint(p(-23.6, -46.7))
    s.ingestPoint(p(200, 0)) // fora de range — ignorado

    expect(useTelemetryStore.getState().route).toEqual([
      [-46.6, -23.5],
      [-46.7, -23.6],
    ])
  })

  it('ingestPoint acumula histórico real de velocidade/aceleração (gráficos B5)', () => {
    const s = useTelemetryStore.getState()
    const p = (speedKmh: number | null, ax: number, ay: number) => ({
      id: 'p', tripId: 't', timestamp: 1, lat: 0, lng: 0,
      speedKmh: speedKmh as number, accelX: ax, accelY: ay, accelZ: 9.8,
    })
    s.ingestPoint(p(10, 3, 4)) // |a horizontal| = 5
    s.ingestPoint(p(null, 0, 0)) // sem velocidade → não entra no speedHistory
    s.ingestPoint(p(20, 6, 8)) // |a horizontal| = 10

    const r = useTelemetryStore.getState()
    expect(r.speedHistory).toEqual([10, 20]) // só velocidades reais
    expect(r.accelHistory).toEqual([5, 0, 10]) // magnitude por ponto
  })

  it('os históricos respeitam a janela MAX_SPEED_HISTORY', () => {
    const s = useTelemetryStore.getState()
    for (let i = 0; i < MAX_SPEED_HISTORY + 20; i++) {
      s.ingestPoint({
        id: 'p', tripId: 't', timestamp: i, lat: 0, lng: 0,
        speedKmh: i, accelX: 0, accelY: 0, accelZ: 9.8,
      })
    }
    const r = useTelemetryStore.getState()
    expect(r.speedHistory).toHaveLength(MAX_SPEED_HISTORY)
    expect(r.accelHistory).toHaveLength(MAX_SPEED_HISTORY)
    // mantém os mais recentes
    expect(r.speedHistory.at(-1)).toBe(MAX_SPEED_HISTORY + 19)
  })
})
