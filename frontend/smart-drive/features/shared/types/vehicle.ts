export enum FuelType {
  GASOLINE = 'GASOLINE',
  ETHANOL = 'ETHANOL',
  FLEX = 'FLEX',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
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

export type VehicleProfile = Readonly<
  Pick<
    Vehicle,
    | 'id'
    | 'brand'
    | 'model'
    | 'year'
    | 'engine'
    | 'fuelType'
    | 'tankCapacityLiters'
    | 'baseMixedConsumptionKmL'
  >
>
