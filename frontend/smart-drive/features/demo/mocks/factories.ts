import type { TelemetryPoint, DrivingEvent, FuelEstimate } from '@/features/shared/types'
import { makeTelemetryPoint, makeDrivingEvent } from '@/features/dashboard/mocks/factories'

export interface DrivingScenario {
  tripId: string
  telemetryPoints: TelemetryPoint[]
  drivingEvents: DrivingEvent[]
  fuelEstimate: FuelEstimate
}

function buildRoute(
  tripId: string,
  count: number,
  speedRange: [number, number]
): TelemetryPoint[] {
  const baseLat = -3.7318
  const baseLng = -38.5213
  const baseTime = Date.now() - count * 2000

  return Array.from({ length: count }, (_, i) => {
    const progress = i / count
    const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0])
    return makeTelemetryPoint({
      tripId,
      timestamp: baseTime + i * 2000,
      lat: baseLat + progress * 0.015,
      lng: baseLng + progress * 0.01,
      speedKmh: parseFloat(speed.toFixed(1)),
      accelX: parseFloat((Math.random() * 0.04 - 0.02).toFixed(4)),
      accelY: parseFloat((Math.random() * 0.04 - 0.02).toFixed(4)),
      accelZ: parseFloat((0.95 + Math.random() * 0.06).toFixed(4)),
    })
  })
}

function makeFuelEstimate(tripId: string, liters: number, cost: number): FuelEstimate {
  return {
    id: `fuel-${tripId}`,
    tripId,
    baseConsumptionKmL: 12.5,
    adjustedConsumptionKmL: 11.8,
    estimatedLitersSpent: liters,
    estimatedCost: cost,
    confidenceLevel: 0.92,
    modelVersion: 'v1.2.0',
  }
}

export function smoothDrivingScenario(): DrivingScenario {
  const tripId = 'demo-trip-smooth'
  const telemetryPoints = buildRoute(tripId, 50, [28, 48])
  const drivingEvents: DrivingEvent[] = [
    makeDrivingEvent({
      tripId,
      type: 'HARD_BRAKE',
      severity: 'LOW',
      value: -0.51,
      threshold: -0.5,
      description: 'Frenagem leve detectada',
    }),
  ]
  return {
    tripId,
    telemetryPoints,
    drivingEvents,
    fuelEstimate: makeFuelEstimate(tripId, 1.2, 7.07),
  }
}

export function normalDrivingScenario(): DrivingScenario {
  const tripId = 'demo-trip-normal'
  const telemetryPoints = buildRoute(tripId, 50, [30, 60])
  const drivingEvents: DrivingEvent[] = [
    makeDrivingEvent({ tripId, type: 'HARD_BRAKE', severity: 'MEDIUM', value: -0.62, threshold: -0.5 }),
    makeDrivingEvent({ tripId, type: 'HARD_ACCELERATION', severity: 'MEDIUM', value: 0.53, threshold: 0.4 }),
    makeDrivingEvent({ tripId, type: 'SHARP_TURN', severity: 'MEDIUM', value: 0.47, threshold: 0.4 }),
    makeDrivingEvent({ tripId, type: 'SPEED_SPIKE', severity: 'LOW', value: 22, threshold: 15 }),
    makeDrivingEvent({ tripId, type: 'HARD_BRAKE', severity: 'HIGH', value: -0.71, threshold: -0.5 }),
  ]
  return {
    tripId,
    telemetryPoints,
    drivingEvents,
    fuelEstimate: makeFuelEstimate(tripId, 1.8, 10.6),
  }
}

export function aggressiveDrivingScenario(): DrivingScenario {
  const tripId = 'demo-trip-aggressive'
  const telemetryPoints = buildRoute(tripId, 50, [45, 90])
  const drivingEvents: DrivingEvent[] = [
    makeDrivingEvent({ tripId, type: 'HARD_ACCELERATION', severity: 'HIGH', value: 0.64, threshold: 0.4 }),
    makeDrivingEvent({ tripId, type: 'HARD_BRAKE', severity: 'CRITICAL', value: -0.74, threshold: -0.5 }),
    makeDrivingEvent({ tripId, type: 'SPEED_SPIKE', severity: 'HIGH', value: 27, threshold: 15 }),
    makeDrivingEvent({ tripId, type: 'SHARP_TURN', severity: 'HIGH', value: 0.57, threshold: 0.4 }),
    makeDrivingEvent({ tripId, type: 'HARD_ACCELERATION', severity: 'HIGH', value: 0.61, threshold: 0.4 }),
    makeDrivingEvent({ tripId, type: 'HARD_BRAKE', severity: 'HIGH', value: -0.68, threshold: -0.5 }),
    makeDrivingEvent({ tripId, type: 'SPEED_SPIKE', severity: 'CRITICAL', value: 28, threshold: 15 }),
    makeDrivingEvent({ tripId, type: 'SHARP_TURN', severity: 'HIGH', value: 0.55, threshold: 0.4 }),
    makeDrivingEvent({ tripId, type: 'IMPACT_SUSPECTED', severity: 'CRITICAL', value: 2.1, threshold: 1.2 }),
    makeDrivingEvent({ tripId, type: 'HARD_ACCELERATION', severity: 'MEDIUM', value: 0.48, threshold: 0.4 }),
  ]
  return {
    tripId,
    telemetryPoints,
    drivingEvents,
    fuelEstimate: makeFuelEstimate(tripId, 2.5, 14.72),
  }
}
