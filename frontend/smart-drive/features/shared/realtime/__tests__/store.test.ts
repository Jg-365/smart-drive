import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DrivingEventType, EventSeverity } from '@/features/shared/types'
import type { DrivingEvent } from '@/features/shared/types'
import { MAX_EVENTS, useDrivingScore, useTelemetryStore } from '../store'

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
})
