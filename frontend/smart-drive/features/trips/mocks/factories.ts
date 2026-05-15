import type { Trip, DrivingEvent, FuelEstimate } from '@/features/shared/types'
import { DrivingEventType, EventSeverity, TripMode, TripStatus } from '@/features/shared/types'

let tripCounter = 0

type TripProfile = 'smooth' | 'normal' | 'aggressive'

function randomBetween(min: number, max: number, decimals = 2): number {
  const value = min + Math.random() * (max - min)
  return parseFloat(value.toFixed(decimals))
}

function scoreForProfile(profile: TripProfile): number {
  if (profile === 'smooth') return randomBetween(82, 95, 0)
  if (profile === 'aggressive') return randomBetween(40, 65, 0)
  return randomBetween(65, 80, 0)
}

export function makeTrip(overrides?: Partial<Trip>): Trip {
  const id = String(++tripCounter).padStart(3, '0')
  const durationSeconds = randomBetween(900, 2700, 0)
  const distanceKm = randomBetween(5, 25, 1)
  const averageSpeedKmh = parseFloat(((distanceKm / durationSeconds) * 3600).toFixed(1))
  const maxSpeedKmh = randomBetween(60, 95, 1)
  const estimatedConsumptionKmL = randomBetween(10.5, 14.5, 1)
  const estimatedFuelSpentLiters = parseFloat((distanceKm / estimatedConsumptionKmL).toFixed(2))

  return {
    id: `trip-${id}`,
    vehicleId: 'vehicle-001',
    deviceId: 'esp32-demo-001',
    driverId: 'driver-001',
    mode: TripMode.REAL,
    startedAt: '2024-03-10T08:00:00.000Z',
    endedAt: '2024-03-10T08:32:00.000Z',
    status: TripStatus.FINISHED,
    distanceKm,
    durationSeconds,
    averageSpeedKmh,
    maxSpeedKmh,
    estimatedConsumptionKmL,
    estimatedFuelSpentLiters,
    drivingScore: scoreForProfile('normal'),
    ...overrides,
  }
}

export function makeTripList(count = 5): Trip[] {
  return Array.from({ length: count }, () => makeTrip())
}

export function makeTripListForVehicle(vehicleId: string): Trip[] {
  return Array.from({ length: 5 }, () => makeTrip({ vehicleId }))
}

export function makeTripSummary(tripId: string) {
  const trip = makeTrip({ id: tripId })
  const events: DrivingEvent[] = [
    {
      id: 'event-001',
      tripId,
      type: DrivingEventType.HARD_BRAKE,
      severity: EventSeverity.HIGH,
      timestamp: new Date(Date.now() - 900000).toISOString(),
      lat: -3.7318,
      lng: -38.5213,
      value: -0.62,
      threshold: -0.5,
      description: 'Frenagem brusca detectada',
    },
    {
      id: 'event-002',
      tripId,
      type: DrivingEventType.HARD_ACCELERATION,
      severity: EventSeverity.MEDIUM,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      lat: -3.7452,
      lng: -38.5301,
      value: 0.52,
      threshold: 0.4,
      description: 'Aceleração brusca detectada',
    },
  ]
  const fuelEstimate: FuelEstimate = {
    id: 'fuel-001',
    tripId,
    baseConsumptionKmL: 12.5,
    adjustedConsumptionKmL: 11.8,
    estimatedLitersSpent: trip.estimatedFuelSpentLiters,
    estimatedCost: parseFloat((trip.estimatedFuelSpentLiters * 5.89).toFixed(2)),
    confidenceLevel: 0.92,
    modelVersion: 'v1.2.0',
  }

  return { trip, events, fuelEstimate }
}
