import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TelemetryPayloadDto } from './telemetry-payload.dto';

const VALID = {
  deviceId: 'esp-001',
  vehicleId: 'veh-001',
  sessionId: 'sess-001',
  timestamp: 1_700_000_000_000,
  gps: { lat: -23.5, lng: -46.6, speedKmh: 42, satellites: 8, hdop: 1.2 },
  imu: { accelX: 0.1, accelY: 0.2, accelZ: 9.8, gyroX: 0, gyroY: 0, gyroZ: 0 },
  events: {
    hardAcceleration: false,
    hardBrake: true,
    sharpTurn: false,
    impactSuspected: false,
  },
  battery: { voltage: 3.9, percentage: 82 },
};

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(TelemetryPayloadDto, payload));

const hasError = (errors: { property: string }[], prop: string) =>
  errors.some((e) => e.property === prop);

const omit = (obj: Record<string, unknown>, key: string) => {
  const copy = { ...obj };
  delete copy[key];
  return copy;
};

describe('TelemetryPayloadDto (contrato v1.0)', () => {
  it('aceita payload completo válido', async () => {
    expect(await validateDto(VALID)).toHaveLength(0);
  });

  it('SPEC: GPS null é aceito (ambiente sem fix), não é erro', async () => {
    const errors = await validateDto({
      ...VALID,
      gps: {
        lat: null,
        lng: null,
        speedKmh: null,
        satellites: null,
        hdop: null,
      },
    });
    expect(errors).toHaveLength(0);
  });

  it('aceita gps ausente e gyro ausente (gyro default 0 no mapper)', async () => {
    const errors = await validateDto({
      deviceId: 'd',
      vehicleId: 'v',
      sessionId: 's',
      timestamp: 1,
      imu: { accelX: 0, accelY: 0, accelZ: 9.8 },
    });
    expect(errors).toHaveLength(0);
  });

  it('SPEC: deviceId obrigatório — rejeita ausente', async () => {
    expect(
      hasError(await validateDto(omit(VALID, 'deviceId')), 'deviceId'),
    ).toBe(true);
  });

  it('SPEC: deviceId não pode ser vazio', async () => {
    expect(
      hasError(await validateDto({ ...VALID, deviceId: '' }), 'deviceId'),
    ).toBe(true);
  });

  it('SPEC: timestamp deve ser número positivo — rejeita 0', async () => {
    expect(
      hasError(await validateDto({ ...VALID, timestamp: 0 }), 'timestamp'),
    ).toBe(true);
  });

  it('SPEC: timestamp obrigatório — rejeita ausente', async () => {
    expect(
      hasError(await validateDto(omit(VALID, 'timestamp')), 'timestamp'),
    ).toBe(true);
  });

  it('SPEC: accelX/Y/Z obrigatórios — rejeita imu sem accelX', async () => {
    const errors = await validateDto({
      ...VALID,
      imu: { accelY: 0.2, accelZ: 9.8 },
    });
    expect(hasError(errors, 'imu')).toBe(true);
  });

  it('SPEC: lat/lng fora de range são rejeitados', async () => {
    const errors = await validateDto({
      ...VALID,
      gps: { ...VALID.gps, lat: 200, lng: -999 },
    });
    expect(hasError(errors, 'gps')).toBe(true);
  });
});
