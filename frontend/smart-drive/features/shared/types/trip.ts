import type { DrivingScore } from './score'
import type { FuelEstimate } from './fuel'

export enum TripMode {
  REAL = 'REAL',
  DEMO = 'DEMO',
  SIMULATOR = 'SIMULATOR',
}

export enum TripStatus {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export interface Trip {
  id: string
  vehicleId: string
  deviceId: string
  driverId: string
  mode: TripMode
  startedAt: string
  endedAt?: string
  status: TripStatus
  distanceKm: number
  durationSeconds: number
  averageSpeedKmh: number
  maxSpeedKmh: number
  estimatedConsumptionKmL: number
  estimatedFuelSpentLiters: number
  drivingScore: number
}

export type TripSummary = Trip & {
  readonly score: DrivingScore
  readonly fuelEstimate: FuelEstimate
}
