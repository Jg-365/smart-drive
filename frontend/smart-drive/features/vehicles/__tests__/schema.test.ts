import { describe, expect, it } from 'vitest'
import { FuelType } from '@/features/shared/types'
import { sanitizeText, validateVehicleForm } from '../schema'

const valid = {
  brand: 'Chevrolet',
  model: 'Onix LT',
  year: '2022',
  engine: '1.0 Turbo',
  fuelType: FuelType.FLEX,
  tankCapacityLiters: '42',
  baseUrbanConsumptionKmL: '12.5',
  baseHighwayConsumptionKmL: '16',
  baseMixedConsumptionKmL: '14',
  weightKg: '1095',
}

describe('sanitizeText', () => {
  it('apara, colapsa espaços e remove caracteres especiais sem rejeitar', () => {
    expect(sanitizeText('  <Fiat>  ')).toBe('Fiat')
    expect(sanitizeText('Onix    LT')).toBe('Onix LT')
    expect(sanitizeText("Citroën C3 (1.6)")).toBe("Citroën C3 (1.6)")
    expect(sanitizeText('   ')).toBe('')
  })
})

describe('validateVehicleForm (JOA-RF-01)', () => {
  it('SPEC: cria veículo com todos os campos válidos', () => {
    const r = validateVehicleForm(valid)
    expect(r.success).toBe(true)
    expect(r.data).toMatchObject({
      brand: 'Chevrolet', model: 'Onix LT', year: 2022, fuelType: FuelType.FLEX,
      tankCapacityLiters: 42, baseUrbanConsumptionKmL: 12.5, weightKg: 1095,
    })
  })

  it('SPEC: peso é opcional — criação sem peso funciona', () => {
    const r = validateVehicleForm({ ...valid, weightKg: '' })
    expect(r.success).toBe(true)
    expect(r.data?.weightKg).toBeUndefined()
  })

  it('SPEC: rejeita consumo urbano <= 0', () => {
    expect(validateVehicleForm({ ...valid, baseUrbanConsumptionKmL: '0' }).errors.baseUrbanConsumptionKmL).toBeTruthy()
    expect(validateVehicleForm({ ...valid, baseUrbanConsumptionKmL: '-5' }).errors.baseUrbanConsumptionKmL).toBeTruthy()
  })

  it('SPEC: rejeita capacidade de tanque <= 0', () => {
    expect(validateVehicleForm({ ...valid, tankCapacityLiters: '0' }).errors.tankCapacityLiters).toBeTruthy()
  })

  it('SPEC: rejeita veículo sem marca', () => {
    expect(validateVehicleForm({ ...valid, brand: '' }).errors.brand).toBeTruthy()
  })

  it('SPEC: rejeita veículo sem modelo', () => {
    expect(validateVehicleForm({ ...valid, model: '' }).errors.model).toBeTruthy()
  })

  it('SPEC: rejeita veículo sem tipo de combustível', () => {
    const r = validateVehicleForm({ ...valid, fuelType: '' })
    expect(r.success).toBe(false)
    expect(r.errors.fuelType).toBeTruthy()
  })

  it('EDGE: marca só com espaços é tratada como vazia', () => {
    expect(validateVehicleForm({ ...valid, brand: '   ' }).errors.brand).toBeTruthy()
  })

  it('EDGE: caracteres especiais em marca/modelo são sanitizados, não rejeitados', () => {
    const r = validateVehicleForm({ ...valid, brand: '<Fiat>', model: 'Strada @ Endurance' })
    expect(r.success).toBe(true)
    expect(r.data?.brand).toBe('Fiat')
    expect(r.data?.model).toBe('Strada Endurance')
  })

  it('EDGE: ano fora de range é rejeitado', () => {
    expect(validateVehicleForm({ ...valid, year: '1800' }).errors.year).toBeTruthy()
    expect(validateVehicleForm({ ...valid, year: String(new Date().getFullYear() + 5) }).errors.year).toBeTruthy()
  })

  it('EDGE: consumo não numérico é rejeitado', () => {
    expect(validateVehicleForm({ ...valid, baseMixedConsumptionKmL: 'abc' }).errors.baseMixedConsumptionKmL).toBeTruthy()
  })
})
