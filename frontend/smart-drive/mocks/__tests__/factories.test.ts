import { describe, it, expect, beforeEach } from 'vitest'
import { makeVehicle, makeVehicleList } from '@/features/vehicles/mocks/factories'
import { makeTrip } from '@/features/trips/mocks/factories'
import { makeDevice } from '@/features/devices/mocks/factories'
import { makeTelemetryPoint, makeDrivingEvent } from '@/features/dashboard/mocks/factories'
import { smoothDrivingScenario, aggressiveDrivingScenario } from '@/features/demo/mocks/factories'

describe('makeVehicle', () => {
  it('returns a valid Vehicle with all required fields', () => {
    const v = makeVehicle()
    expect(v.id).toMatch(/^vehicle-\d{3}$/)
    expect(v.ownerId).toBeTruthy()
    expect(v.brand).toBeTruthy()
    expect(v.model).toBeTruthy()
    expect(v.year).toBeGreaterThan(2000)
    expect(v.engine).toBeTruthy()
    expect(v.fuelType).toBeTruthy()
    expect(v.tankCapacityLiters).toBeGreaterThan(0)
    expect(v.baseUrbanConsumptionKmL).toBeGreaterThan(0)
    expect(v.baseHighwayConsumptionKmL).toBeGreaterThan(0)
    expect(v.baseMixedConsumptionKmL).toBeGreaterThan(0)
    expect(v.calibrationFactor).toBeDefined()
    expect(v.createdAt).toBeTruthy()
  })

  it('overrides brand when provided', () => {
    const v = makeVehicle({ brand: 'Toyota' })
    expect(v.brand).toBe('Toyota')
  })

  it('overrides multiple fields', () => {
    const v = makeVehicle({ brand: 'Toyota', year: 2025, fuelType: 'ELECTRIC' })
    expect(v.brand).toBe('Toyota')
    expect(v.year).toBe(2025)
    expect(v.fuelType).toBe('ELECTRIC')
  })
})

describe('makeVehicleList', () => {
  it('returns array of length 3 with unique IDs', () => {
    const list = makeVehicleList(3)
    expect(list).toHaveLength(3)
    const ids = list.map((v) => v.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(3)
  })

  it('uses default count of 4', () => {
    const list = makeVehicleList()
    expect(list).toHaveLength(4)
  })
})

describe('makeTrip', () => {
  it('has valid numeric fields > 0', () => {
    const t = makeTrip()
    expect(t.distanceKm).toBeGreaterThan(0)
    expect(t.durationSeconds).toBeGreaterThan(0)
    expect(t.averageSpeedKmh).toBeGreaterThan(0)
    expect(t.maxSpeedKmh).toBeGreaterThan(0)
    expect(t.estimatedConsumptionKmL).toBeGreaterThan(0)
    expect(t.estimatedFuelSpentLiters).toBeGreaterThan(0)
    expect(t.drivingScore).toBeGreaterThan(0)
  })

  it('has required string fields', () => {
    const t = makeTrip()
    expect(t.id).toMatch(/^trip-\d{3}$/)
    expect(t.vehicleId).toBeTruthy()
    expect(t.deviceId).toBeTruthy()
    expect(t.driverId).toBeTruthy()
    expect(t.startedAt).toBeTruthy()
  })

  it('overrides vehicleId', () => {
    const t = makeTrip({ vehicleId: 'vehicle-999' })
    expect(t.vehicleId).toBe('vehicle-999')
  })
})

describe('makeDevice', () => {
  it('returns a valid Device with all required fields', () => {
    const d = makeDevice()
    expect(d.id).toMatch(/^device-\d{3}$/)
    expect(d.deviceCode).toBeTruthy()
    expect(d.name).toBeTruthy()
    expect(d.vehicleId).toBeTruthy()
    expect(d.firmwareVersion).toBeTruthy()
    expect(d.status).toBeTruthy()
  })

  it('overrides status to ONLINE', () => {
    const d = makeDevice({ status: 'ONLINE' })
    expect(d.status).toBe('ONLINE')
  })

  it('overrides status to OFFLINE', () => {
    const d = makeDevice({ status: 'OFFLINE' })
    expect(d.status).toBe('OFFLINE')
  })
})

describe('makeTelemetryPoint', () => {
  it('has accelZ close to 0.98 (±0.5)', () => {
    const tp = makeTelemetryPoint()
    expect(tp.accelZ).toBeGreaterThan(0.48)
    expect(tp.accelZ).toBeLessThan(1.48)
  })

  it('has all required fields', () => {
    const tp = makeTelemetryPoint()
    expect(tp.id).toBeTruthy()
    expect(tp.tripId).toBeTruthy()
    expect(tp.timestamp).toBeGreaterThan(0)
    expect(tp.lat).toBeDefined()
    expect(tp.lng).toBeDefined()
    expect(tp.speedKmh).toBeGreaterThanOrEqual(0)
  })

  it('overrides tripId', () => {
    const tp = makeTelemetryPoint({ tripId: 'trip-xyz' })
    expect(tp.tripId).toBe('trip-xyz')
  })
})

describe('makeDrivingEvent', () => {
  it('has negative value for HARD_BRAKE', () => {
    const e = makeDrivingEvent({ type: 'HARD_BRAKE' })
    expect(e.value).toBeLessThan(0)
  })

  it('has positive value for HARD_ACCELERATION', () => {
    const e = makeDrivingEvent({ type: 'HARD_ACCELERATION' })
    expect(e.value).toBeGreaterThan(0)
  })

  it('has all required fields', () => {
    const e = makeDrivingEvent({ type: 'HARD_BRAKE' })
    expect(e.id).toBeTruthy()
    expect(e.tripId).toBeTruthy()
    expect(e.type).toBe('HARD_BRAKE')
    expect(e.threshold).toBe(-0.5)
    expect(e.description).toBeTruthy()
  })
})

describe('smoothDrivingScenario', () => {
  it('has at most 2 driving events', () => {
    const s = smoothDrivingScenario()
    expect(s.drivingEvents.length).toBeLessThanOrEqual(2)
  })

  it('has 50 telemetry points', () => {
    const s = smoothDrivingScenario()
    expect(s.telemetryPoints).toHaveLength(50)
  })

  it('has a fuel estimate', () => {
    const s = smoothDrivingScenario()
    expect(s.fuelEstimate).toBeDefined()
    expect(s.fuelEstimate.estimatedLitersSpent).toBeGreaterThan(0)
  })
})

describe('aggressiveDrivingScenario', () => {
  it('has at least 8 driving events', () => {
    const s = aggressiveDrivingScenario()
    expect(s.drivingEvents.length).toBeGreaterThanOrEqual(8)
  })

  it('has 50 telemetry points', () => {
    const s = aggressiveDrivingScenario()
    expect(s.telemetryPoints).toHaveLength(50)
  })
})
