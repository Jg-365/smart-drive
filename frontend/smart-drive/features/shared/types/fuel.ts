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

export interface RefuelRecord {
  id: string
  vehicleId: string
  date: string
  liters: number
  pricePerLiter: number
  odometerKm: number
  fullTank: boolean
  computedRealConsumptionKmL?: number
}

export interface FuelConsumption {
  kmL: number
  liters: number
}
