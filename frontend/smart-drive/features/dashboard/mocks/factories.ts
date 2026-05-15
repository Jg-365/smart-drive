import type { TelemetryPoint, DrivingEvent, DrivingEventType } from '@/features/shared/types'

let telemetryCounter = 0
let eventCounter = 0

function rand(min: number, max: number, decimals = 4): number {
  return parseFloat((min + Math.random() * (max - min)).toFixed(decimals))
}

export function makeTelemetryPoint(overrides?: Partial<TelemetryPoint>): TelemetryPoint {
  const id = String(++telemetryCounter).padStart(4, '0')
  return {
    id: `telemetry-${id}`,
    tripId: 'trip-001',
    timestamp: Date.now(),
    lat: rand(-3.74, -3.72),
    lng: rand(-38.535, -38.51),
    speedKmh: rand(20, 50, 1),
    accelX: rand(-0.05, 0.05),
    accelY: rand(-0.05, 0.05),
    accelZ: rand(0.93, 1.03),
    gyroX: rand(-0.02, 0.02),
    gyroY: rand(-0.02, 0.02),
    gyroZ: rand(-0.02, 0.02),
    satellites: 8,
    hdop: rand(0.8, 1.5, 2),
    ...overrides,
  }
}

const EVENT_CONFIGS: Record<
  DrivingEventType,
  { value: [number, number]; threshold: number; description: string }
> = {
  HARD_BRAKE: { value: [-0.75, -0.55], threshold: -0.5, description: 'Frenagem brusca detectada' },
  HARD_ACCELERATION: { value: [0.45, 0.65], threshold: 0.4, description: 'Aceleração brusca detectada' },
  SHARP_TURN: { value: [0.42, 0.58], threshold: 0.4, description: 'Curva acentuada detectada' },
  SPEED_SPIKE: { value: [18, 28], threshold: 15, description: 'Excesso de velocidade detectado' },
  IMPACT_SUSPECTED: { value: [1.5, 2.5], threshold: 1.2, description: 'Possível impacto detectado' },
  GPS_LOST: { value: [0, 0], threshold: 0, description: 'Sinal GPS perdido' },
  DEVICE_DISCONNECTED: { value: [0, 0], threshold: 0, description: 'Dispositivo desconectado' },
}

export function makeDrivingEvent(overrides?: Partial<DrivingEvent>): DrivingEvent {
  const id = String(++eventCounter).padStart(3, '0')
  const type: DrivingEventType = overrides?.type ?? 'HARD_BRAKE'
  const config = EVENT_CONFIGS[type]
  const value = rand(config.value[0], config.value[1])

  return {
    id: `event-${id}`,
    tripId: 'trip-001',
    type,
    severity: 'HIGH',
    timestamp: Date.now(),
    lat: rand(-3.74, -3.72),
    lng: rand(-38.535, -38.51),
    value,
    threshold: config.threshold,
    description: config.description,
    ...overrides,
  }
}

export function makeTelemetryStream(count: number, tripId = 'trip-001'): TelemetryPoint[] {
  const baseLat = -3.7318
  const baseLng = -38.5213
  const baseTime = Date.now() - count * 2000

  return Array.from({ length: count }, (_, i) => {
    const progress = i / count
    return makeTelemetryPoint({
      tripId,
      timestamp: baseTime + i * 2000,
      lat: baseLat + progress * 0.015,
      lng: baseLng + progress * 0.01,
      speedKmh: rand(25, 55, 1),
    })
  })
}
