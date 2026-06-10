import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FuelType } from '../../../generated/prisma/client';
import { CreateVehicleDto } from './create-vehicle.dto';

const VALID_PAYLOAD = {
  brand: 'Fiat',
  model: 'Uno',
  year: 2015,
  engine: '1.0',
  fuelType: FuelType.FLEX,
  tankCapacityLiters: 48,
  baseUrbanConsumptionKmL: 9,
  baseHighwayConsumptionKmL: 12,
  baseMixedConsumptionKmL: 10,
};

async function validateDto(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateVehicleDto, payload);
  return validate(dto);
}

describe('CreateVehicleDto', () => {
  it('SPEC: deve criar veículo com todos os campos válidos', async () => {
    const errors = await validateDto(VALID_PAYLOAD);
    expect(errors).toHaveLength(0);
  });

  it('SPEC: peso deve ser opcional — criação sem peso deve funcionar', async () => {
    const errors = await validateDto(VALID_PAYLOAD);
    expect(errors).toHaveLength(0);
  });

  it('aceita peso quando informado', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, weightKg: 1200 });
    expect(errors).toHaveLength(0);
  });

  it('SPEC: deve rejeitar veículo com consumo urbano <= 0 (zero)', async () => {
    const errors = await validateDto({
      ...VALID_PAYLOAD,
      baseUrbanConsumptionKmL: 0,
    });
    expect(errors.some((e) => e.property === 'baseUrbanConsumptionKmL')).toBe(
      true,
    );
  });

  it('SPEC: deve rejeitar veículo com consumo urbano negativo', async () => {
    const errors = await validateDto({
      ...VALID_PAYLOAD,
      baseUrbanConsumptionKmL: -5,
    });
    expect(errors.some((e) => e.property === 'baseUrbanConsumptionKmL')).toBe(
      true,
    );
  });

  it('SPEC: deve rejeitar veículo com consumo rodoviário <= 0', async () => {
    const errors = await validateDto({
      ...VALID_PAYLOAD,
      baseHighwayConsumptionKmL: 0,
    });
    expect(errors.some((e) => e.property === 'baseHighwayConsumptionKmL')).toBe(
      true,
    );
  });

  it('SPEC: deve rejeitar veículo com consumo misto <= 0', async () => {
    const errors = await validateDto({
      ...VALID_PAYLOAD,
      baseMixedConsumptionKmL: 0,
    });
    expect(errors.some((e) => e.property === 'baseMixedConsumptionKmL')).toBe(
      true,
    );
  });

  it('SPEC: deve rejeitar veículo com capacidade de tanque <= 0 (zero)', async () => {
    const errors = await validateDto({
      ...VALID_PAYLOAD,
      tankCapacityLiters: 0,
    });
    expect(errors.some((e) => e.property === 'tankCapacityLiters')).toBe(true);
  });

  it('SPEC: deve rejeitar veículo com capacidade de tanque negativa', async () => {
    const errors = await validateDto({
      ...VALID_PAYLOAD,
      tankCapacityLiters: -1,
    });
    expect(errors.some((e) => e.property === 'tankCapacityLiters')).toBe(true);
  });

  it('SPEC: deve rejeitar veículo sem marca', async () => {
    const payload: Record<string, unknown> = { ...VALID_PAYLOAD };
    delete payload.brand;
    const errors = await validateDto(payload);
    expect(errors.some((e) => e.property === 'brand')).toBe(true);
  });

  it('SPEC: deve rejeitar veículo sem modelo', async () => {
    const payload: Record<string, unknown> = { ...VALID_PAYLOAD };
    delete payload.model;
    const errors = await validateDto(payload);
    expect(errors.some((e) => e.property === 'model')).toBe(true);
  });

  it('SPEC: deve rejeitar veículo sem tipo de combustível', async () => {
    const payload: Record<string, unknown> = { ...VALID_PAYLOAD };
    delete payload.fuelType;
    const errors = await validateDto(payload);
    expect(errors.some((e) => e.property === 'fuelType')).toBe(true);
  });

  it('SPEC: deve rejeitar tipo de combustível inválido', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, fuelType: 'NUCLEAR' });
    expect(errors.some((e) => e.property === 'fuelType')).toBe(true);
  });

  it('EDGE: marca apenas com espaços deve ser tratada como vazia e rejeitada', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, brand: '   ' });
    expect(errors.some((e) => e.property === 'brand')).toBe(true);
  });

  it('EDGE: modelo apenas com espaços deve ser tratado como vazio e rejeitado', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, model: '   ' });
    expect(errors.some((e) => e.property === 'model')).toBe(true);
  });

  it('EDGE: caracteres especiais em marca/modelo são sanitizados, não rejeitados', async () => {
    const dto = plainToInstance(CreateVehicleDto, {
      ...VALID_PAYLOAD,
      brand: '<Fiat>',
      model: 'Uno*!',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.brand).toBe('Fiat');
    expect(dto.model).toBe('Uno');
  });

  it('EDGE: ano fora do range razoável deve ser rejeitado', async () => {
    const tooOld = await validateDto({ ...VALID_PAYLOAD, year: 1899 });
    expect(tooOld.some((e) => e.property === 'year')).toBe(true);

    const tooNew = await validateDto({
      ...VALID_PAYLOAD,
      year: new Date().getFullYear() + 5,
    });
    expect(tooNew.some((e) => e.property === 'year')).toBe(true);
  });
});
