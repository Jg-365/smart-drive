export interface Coordinates {
  readonly lat: number
  readonly lng: number
}

export interface AccelerationVector {
  readonly x: number
  readonly y: number
  readonly z: number
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
