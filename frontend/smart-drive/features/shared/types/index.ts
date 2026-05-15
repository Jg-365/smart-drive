export type FuelType = 'GASOLINE' | 'ETHANOL' | 'FLEX' | 'DIESEL' | 'ELECTRIC' | 'HYBRID'
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'PAIRING' | 'ERROR'
export type TripStatus = 'ACTIVE' | 'FINISHED' | 'CANCELLED'
export type TripMode = 'REAL' | 'DEMO' | 'SIMULATOR'
export type DrivingEventType =
  | 'HARD_ACCELERATION'
  | 'HARD_BRAKE'
  | 'SHARP_TURN'
  | 'IMPACT_SUSPECTED'
  | 'SPEED_SPIKE'
  | 'GPS_LOST'
  | 'DEVICE_DISCONNECTED'
export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ScoreClassification = 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'AGGRESSIVE' | 'CRITICAL'

export interface Coordinates {
  lat: number
  lng: number
}

export interface AccelerationVector {
  x: number
  y: number
  z: number
}

export interface Vehicle {
  id: string
  ownerId: string
  brand: string
  model: string
  year: number
  engine: string
  fuelType: FuelType
  tankCapacityLiters: number
  baseUrbanConsumptionKmL: number
  baseHighwayConsumptionKmL: number
  baseMixedConsumptionKmL: number
  weightKg?: number
  calibrationFactor: number
  createdAt: string
}

export interface Device {
  id: string
  deviceCode: string
  name: string
  vehicleId: string
  firmwareVersion: string
  lastSeenAt: string
  status: DeviceStatus
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

export interface TelemetryPoint {
  id: string
  tripId: string
  timestamp: number
  lat: number
  lng: number
  speedKmh: number
  accelX: number
  accelY: number
  accelZ: number
  gyroX?: number
  gyroY?: number
  gyroZ?: number
  satellites?: number
  hdop?: number
}

export interface DrivingEvent {
  id: string
  tripId: string
  type: DrivingEventType
  severity: EventSeverity
  timestamp: number
  lat?: number
  lng?: number
  value: number
  threshold: number
  description: string
}

export interface FuelEstimate {
  id: string
  tripId: string
  baseConsumptionKmL: number
  adjustedConsumptionKmL: number
  estimatedLitersSpent: number
  estimatedCost?: number
  confidenceLevel: number
  modelVersion: string
}
