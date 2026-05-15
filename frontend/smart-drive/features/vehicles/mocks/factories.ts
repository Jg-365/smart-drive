import type { Vehicle } from '@/features/shared/types'
import { FuelType } from '@/features/shared/types'

let vehicleCounter = 0

const PRESET_VEHICLES: Omit<Vehicle, 'id' | 'ownerId' | 'calibrationFactor' | 'createdAt'>[] = [
  {
    brand: 'Chevrolet',
    model: 'Onix LT 1.0 Turbo',
    year: 2022,
    engine: '1.0 Turbo',
    fuelType: FuelType.FLEX,
    tankCapacityLiters: 42,
    baseUrbanConsumptionKmL: 12.5,
    baseHighwayConsumptionKmL: 16.0,
    baseMixedConsumptionKmL: 14.0,
    weightKg: 1095,
  },
  {
    brand: 'Fiat',
    model: 'Argo Drive 1.0',
    year: 2021,
    engine: '1.0',
    fuelType: FuelType.FLEX,
    tankCapacityLiters: 48,
    baseUrbanConsumptionKmL: 11.0,
    baseHighwayConsumptionKmL: 14.5,
    baseMixedConsumptionKmL: 12.5,
    weightKg: 985,
  },
  {
    brand: 'Hyundai',
    model: 'HB20 Comfort 1.0',
    year: 2023,
    engine: '1.0',
    fuelType: FuelType.GASOLINE,
    tankCapacityLiters: 47,
    baseUrbanConsumptionKmL: 13.0,
    baseHighwayConsumptionKmL: 15.5,
    baseMixedConsumptionKmL: 14.0,
    weightKg: 1040,
  },
  {
    brand: 'Jeep',
    model: 'Compass Longitude 2.0',
    year: 2020,
    engine: '2.0 Diesel',
    fuelType: FuelType.DIESEL,
    tankCapacityLiters: 64,
    baseUrbanConsumptionKmL: 10.5,
    baseHighwayConsumptionKmL: 14.0,
    baseMixedConsumptionKmL: 12.0,
    weightKg: 1620,
  },
]

export function makeVehicle(overrides?: Partial<Vehicle>): Vehicle {
  const index = vehicleCounter % PRESET_VEHICLES.length
  const preset = PRESET_VEHICLES[index]
  const id = String(++vehicleCounter).padStart(3, '0')

  return {
    id: `vehicle-${id}`,
    ownerId: 'owner-001',
    calibrationFactor: 1.0,
    createdAt: '2024-01-15T10:00:00.000Z',
    ...preset,
    ...overrides,
  }
}

export function makeVehicleList(count = 4): Vehicle[] {
  return Array.from({ length: count }, () => makeVehicle())
}
