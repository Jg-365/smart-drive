import { DrivingEventType, ScoreClassification } from '@/features/shared/types'
import type { DrivingEvent } from '@/features/shared/types'

/**
 * Formata duração em segundos como hh:mm:ss (JOA-RF-08). Valores inválidos
 * (negativos / NaN) caem para 00:00:00 — viagem de 0s não quebra a UI.
 */
export function formatDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** Bandas de classificação do score (0..100) → enum + rótulo textual PT-BR. */
export function classifyScore(value: number): {
  classification: ScoreClassification
  label: string
} {
  const v = Number.isFinite(value) ? value : 0
  if (v >= 85) return { classification: ScoreClassification.EXCELLENT, label: 'Excelente' }
  if (v >= 70) return { classification: ScoreClassification.GOOD, label: 'Boa' }
  if (v >= 55) return { classification: ScoreClassification.MODERATE, label: 'Moderada' }
  if (v >= 40) return { classification: ScoreClassification.AGGRESSIVE, label: 'Agressiva' }
  return { classification: ScoreClassification.CRITICAL, label: 'Crítica' }
}

/**
 * Distância legível. Sem GPS (rota vazia) → 'não disponível' em vez de 0 km
 * (edge case JOA-RF-08). Com GPS, mostra a distância (inclusive 0,0 km).
 */
export function formatDistance(distanceKm: number, hasGps: boolean): string {
  if (!hasGps) return 'não disponível'
  const v = Number.isFinite(distanceKm) && distanceKm >= 0 ? distanceKm : 0
  return `${v.toFixed(1).replace('.', ',')} km`
}

/** Há dados de GPS suficientes para falar em trajeto/distância? */
export function hasGpsData(route: { lat: number; lng: number }[] | undefined): boolean {
  return Array.isArray(route) && route.length > 0
}

/**
 * Gera ao menos uma recomendação de melhoria (JOA-RF-08). Sem eventos →
 * recomendação positiva; com eventos → dicas conforme os tipos predominantes.
 */
export function buildRecommendations(events: DrivingEvent[]): string[] {
  if (!events || events.length === 0) {
    return ['Condução exemplar — nenhum evento de risco detectado. Continue assim!']
  }

  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1
    return acc
  }, {})

  const recs: string[] = []
  if (counts[DrivingEventType.HARD_BRAKE])
    recs.push('Antecipe as frenagens mantendo distância do veículo à frente.')
  if (counts[DrivingEventType.HARD_ACCELERATION])
    recs.push('Acelere de forma mais gradual para economizar combustível.')
  if (counts[DrivingEventType.SHARP_TURN])
    recs.push('Reduza a velocidade antes das curvas para uma condução mais segura.')
  if (counts[DrivingEventType.SPEED_SPIKE])
    recs.push('Mantenha a velocidade dentro dos limites da via.')
  if (counts[DrivingEventType.IMPACT_SUSPECTED])
    recs.push('Impacto suspeito registrado — verifique o veículo se necessário.')

  // Garante pelo menos uma recomendação mesmo para tipos sem dica específica.
  if (recs.length === 0) recs.push('Atenção aos eventos registrados para melhorar seu score.')
  return recs
}
