import { describe, it, expectTypeOf } from 'vitest'
import type { Vehicle } from '../vehicle'
import type { Device } from '../device'
import type { Trip, TripSummary } from '../trip'
import type { TelemetryPoint, Coordinates, AccelerationVector } from '../telemetry'
import type { DrivingEvent } from '../event'
import type { FuelEstimate, RefuelRecord } from '../fuel'
import type { DrivingScore } from '../score'
import {
  FuelType,
  DeviceStatus,
  TripMode,
  TripStatus,
  DrivingEventType,
  EventSeverity,
  ScoreClassification,
} from '../index'

describe('FuelType enum', () => {
  it('has GASOLINE', () => {
    expectTypeOf(FuelType.GASOLINE).toBeString()
  })
  it('has ETHANOL', () => {
    expectTypeOf(FuelType.ETHANOL).toBeString()
  })
  it('has FLEX', () => {
    expectTypeOf(FuelType.FLEX).toBeString()
  })
  it('has DIESEL', () => {
    expectTypeOf(FuelType.DIESEL).toBeString()
  })
  it('has ELECTRIC', () => {
    expectTypeOf(FuelType.ELECTRIC).toBeString()
  })
  it('has HYBRID', () => {
    expectTypeOf(FuelType.HYBRID).toBeString()
  })
})

describe('DeviceStatus enum', () => {
  it('has ONLINE', () => {
    expectTypeOf(DeviceStatus.ONLINE).toBeString()
  })
  it('has OFFLINE', () => {
    expectTypeOf(DeviceStatus.OFFLINE).toBeString()
  })
  it('has PAIRING', () => {
    expectTypeOf(DeviceStatus.PAIRING).toBeString()
  })
  it('has ERROR', () => {
    expectTypeOf(DeviceStatus.ERROR).toBeString()
  })
})

describe('DrivingEventType enum', () => {
  it('has all 7 event types', () => {
    expectTypeOf(DrivingEventType.HARD_ACCELERATION).toBeString()
    expectTypeOf(DrivingEventType.HARD_BRAKE).toBeString()
    expectTypeOf(DrivingEventType.SHARP_TURN).toBeString()
    expectTypeOf(DrivingEventType.IMPACT_SUSPECTED).toBeString()
    expectTypeOf(DrivingEventType.SPEED_SPIKE).toBeString()
    expectTypeOf(DrivingEventType.GPS_LOST).toBeString()
    expectTypeOf(DrivingEventType.DEVICE_DISCONNECTED).toBeString()
  })
})

describe('ScoreClassification enum', () => {
  it('maps to correct string values', () => {
    expectTypeOf(ScoreClassification.EXCELLENT).toBeString()
    expectTypeOf(ScoreClassification.GOOD).toBeString()
    expectTypeOf(ScoreClassification.MODERATE).toBeString()
    expectTypeOf(ScoreClassification.AGGRESSIVE).toBeString()
    expectTypeOf(ScoreClassification.CRITICAL).toBeString()
  })
})

describe('Vehicle type', () => {
  it('requires id, brand, model, fuelType', () => {
    const v: Vehicle = {
      id: 'v1',
      ownerId: 'o1',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2023,
      engine: '2.0',
      fuelType: FuelType.FLEX,
      tankCapacityLiters: 50,
      baseUrbanConsumptionKmL: 10,
      baseHighwayConsumptionKmL: 14,
      baseMixedConsumptionKmL: 12,
      calibrationFactor: 1,
      createdAt: new Date().toISOString(),
    }
    expectTypeOf(v.id).toBeString()
    expectTypeOf(v.brand).toBeString()
    expectTypeOf(v.model).toBeString()
    expectTypeOf(v.fuelType).toEqualTypeOf<FuelType>()
  })
})

describe('Coordinates', () => {
  it('has lat and lng as numbers', () => {
    const c: Coordinates = { lat: -23.5, lng: -46.6 }
    expectTypeOf(c.lat).toBeNumber()
    expectTypeOf(c.lng).toBeNumber()
  })
})

describe('AccelerationVector', () => {
  it('has x, y, z as numbers', () => {
    const a: AccelerationVector = { x: 0.1, y: 0.2, z: 9.8 }
    expectTypeOf(a.x).toBeNumber()
    expectTypeOf(a.y).toBeNumber()
    expectTypeOf(a.z).toBeNumber()
  })
})

describe('Device type', () => {
  it('has id and status', () => {
    const d: Device = {
      id: 'd1',
      deviceCode: 'DC001',
      name: 'OBD Sensor',
      vehicleId: 'v1',
      firmwareVersion: '1.0.0',
      lastSeenAt: new Date().toISOString(),
      status: DeviceStatus.ONLINE,
    }
    expectTypeOf(d.id).toBeString()
    expectTypeOf(d.status).toEqualTypeOf<DeviceStatus>()
  })
})

describe('Trip type', () => {
  it('has required fields and optional endedAt', () => {
    const t: Trip = {
      id: 't1',
      vehicleId: 'v1',
      deviceId: 'd1',
      driverId: 'u1',
      mode: TripMode.REAL,
      startedAt: new Date().toISOString(),
      status: TripStatus.ACTIVE,
      distanceKm: 10,
      durationSeconds: 600,
      averageSpeedKmh: 60,
      maxSpeedKmh: 100,
      estimatedConsumptionKmL: 12,
      estimatedFuelSpentLiters: 0.8,
      drivingScore: 85,
    }
    expectTypeOf(t.id).toBeString()
    expectTypeOf(t.endedAt).toEqualTypeOf<string | undefined>()
  })
})

describe('TelemetryPoint type', () => {
  it('has required fields and optional gyro/satellites/hdop', () => {
    const tp: TelemetryPoint = {
      id: 'tp1',
      tripId: 't1',
      timestamp: Date.now(),
      lat: -23.5,
      lng: -46.6,
      speedKmh: 60,
      accelX: 0.1,
      accelY: 0.0,
      accelZ: 9.8,
    }
    expectTypeOf(tp.id).toBeString()
    expectTypeOf(tp.timestamp).toBeNumber()
    expectTypeOf(tp.gyroX).toEqualTypeOf<number | undefined>()
  })
})

describe('DrivingEvent type', () => {
  it('has id, tripId, type, severity', () => {
    const e: DrivingEvent = {
      id: 'e1',
      tripId: 't1',
      type: DrivingEventType.HARD_BRAKE,
      severity: EventSeverity.HIGH,
      timestamp: new Date().toISOString(),
      value: 8.5,
      threshold: 5.0,
      description: 'Hard brake detected',
    }
    expectTypeOf(e.id).toBeString()
    expectTypeOf(e.type).toEqualTypeOf<DrivingEventType>()
    expectTypeOf(e.severity).toEqualTypeOf<EventSeverity>()
    expectTypeOf(e.lat).toEqualTypeOf<number | undefined>()
  })
})

describe('FuelEstimate type', () => {
  it('has required fields and optional estimatedCost', () => {
    const fe: FuelEstimate = {
      id: 'fe1',
      tripId: 't1',
      baseConsumptionKmL: 12,
      adjustedConsumptionKmL: 11.5,
      estimatedLitersSpent: 0.8,
      confidenceLevel: 0.9,
      modelVersion: 'v1',
    }
    expectTypeOf(fe.id).toBeString()
    expectTypeOf(fe.estimatedCost).toEqualTypeOf<number | undefined>()
    expectTypeOf(fe.confidenceLevel).toBeNumber()
  })
})

describe('RefuelRecord type', () => {
  it('has required fields and optional computedRealConsumptionKmL', () => {
    const r: RefuelRecord = {
      id: 'r1',
      vehicleId: 'v1',
      date: '2026-01-01',
      liters: 40,
      pricePerLiter: 5.99,
      odometerKm: 50000,
      fullTank: true,
    }
    expectTypeOf(r.id).toBeString()
    expectTypeOf(r.fullTank).toBeBoolean()
    expectTypeOf(r.computedRealConsumptionKmL).toEqualTypeOf<number | undefined>()
  })
})

describe('DrivingScore type', () => {
  it('has value, classification and penalties', () => {
    const s: DrivingScore = {
      value: 92,
      classification: ScoreClassification.EXCELLENT,
      penalties: {
        hardAccelerations: 0,
        hardBrakes: 1,
        sharpTurns: 0,
        impactsSuspected: 0,
        speedInstability: 2,
      },
    }
    expectTypeOf(s.value).toBeNumber()
    expectTypeOf(s.classification).toEqualTypeOf<ScoreClassification>()
  })
})

describe('TripSummary type', () => {
  it('is assignable from trip + score + fuel fields', () => {
    const summary: TripSummary = {
      id: 't1',
      vehicleId: 'v1',
      deviceId: 'd1',
      driverId: 'u1',
      mode: TripMode.REAL,
      startedAt: new Date().toISOString(),
      status: TripStatus.FINISHED,
      distanceKm: 25,
      durationSeconds: 1800,
      averageSpeedKmh: 50,
      maxSpeedKmh: 90,
      estimatedConsumptionKmL: 11,
      estimatedFuelSpentLiters: 2.2,
      drivingScore: 78,
      score: {
        value: 78,
        classification: ScoreClassification.GOOD,
        penalties: {
          hardAccelerations: 1,
          hardBrakes: 2,
          sharpTurns: 1,
          impactsSuspected: 0,
          speedInstability: 3,
        },
      },
      fuelEstimate: {
        id: 'fe1',
        tripId: 't1',
        baseConsumptionKmL: 12,
        adjustedConsumptionKmL: 11,
        estimatedLitersSpent: 2.2,
        confidenceLevel: 0.85,
        modelVersion: 'v1',
      },
    }
    expectTypeOf(summary.id).toBeString()
    expectTypeOf(summary.score.value).toBeNumber()
  })
})
