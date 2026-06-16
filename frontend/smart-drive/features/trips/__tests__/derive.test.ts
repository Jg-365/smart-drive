import { describe, expect, it } from 'vitest'
import { DrivingEventType, EventSeverity, ScoreClassification } from '@/features/shared/types'
import type { DrivingEvent } from '@/features/shared/types'
import {
  buildRecommendations, classifyScore, formatDistance, formatDuration, hasGpsData,
} from '../derive'

const ev = (type: DrivingEventType): DrivingEvent => ({
  id: 'e-' + type, tripId: 't', type, severity: EventSeverity.HIGH,
  timestamp: '2024-03-10T08:10:00.000Z', value: 0.6, threshold: 0.5, description: '',
})

describe('formatDuration (JOA-RF-08)', () => {
  it('formata hh:mm:ss', () => {
    expect(formatDuration(3661)).toBe('01:01:01')
    expect(formatDuration(3374)).toBe('00:56:14')
  })
  it('EDGE: 0s e valores inválidos → 00:00:00', () => {
    expect(formatDuration(0)).toBe('00:00:00')
    expect(formatDuration(-5)).toBe('00:00:00')
    expect(formatDuration(NaN)).toBe('00:00:00')
  })
})

describe('classifyScore (JOA-RF-08)', () => {
  it('mapeia bandas com rótulo textual', () => {
    expect(classifyScore(90).label).toBe('Excelente')
    expect(classifyScore(75).label).toBe('Boa')
    expect(classifyScore(60).label).toBe('Moderada')
    expect(classifyScore(45).label).toBe('Agressiva')
  })
  it('EDGE: score 0 → Crítica; score 100 → Excelente', () => {
    expect(classifyScore(0)).toEqual({ classification: ScoreClassification.CRITICAL, label: 'Crítica' })
    expect(classifyScore(100)).toEqual({ classification: ScoreClassification.EXCELLENT, label: 'Excelente' })
  })
})

describe('formatDistance / hasGpsData (JOA-RF-08)', () => {
  it('com GPS mostra distância (inclui 0,0 km)', () => {
    expect(formatDistance(28.4, true)).toBe('28,4 km')
    expect(formatDistance(0, true)).toBe('0,0 km')
  })
  it('EDGE: sem GPS → "não disponível", não 0', () => {
    expect(formatDistance(0, false)).toBe('não disponível')
    expect(formatDistance(10, false)).toBe('não disponível')
  })
  it('hasGpsData reflete presença de pontos', () => {
    expect(hasGpsData([])).toBe(false)
    expect(hasGpsData(undefined)).toBe(false)
    expect(hasGpsData([{ lat: 1, lng: 2 }])).toBe(true)
  })
})

describe('buildRecommendations (JOA-RF-08)', () => {
  it('SPEC: sem eventos → recomendação positiva (não lista vazia)', () => {
    const recs = buildRecommendations([])
    expect(recs.length).toBeGreaterThanOrEqual(1)
    expect(recs[0]).toMatch(/exemplar/i)
  })
  it('SPEC: gera dica conforme o tipo de evento', () => {
    const recs = buildRecommendations([ev(DrivingEventType.HARD_BRAKE)])
    expect(recs.length).toBeGreaterThanOrEqual(1)
    expect(recs.join(' ')).toMatch(/frenagens/i)
  })
  it('cobre múltiplos tipos e sempre retorna ao menos uma', () => {
    const recs = buildRecommendations([
      ev(DrivingEventType.HARD_ACCELERATION),
      ev(DrivingEventType.SHARP_TURN),
    ])
    expect(recs.length).toBeGreaterThanOrEqual(2)
  })
})
