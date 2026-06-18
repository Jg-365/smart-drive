import { toSimPayload } from './input.mapper';
import type { LiveTelemetryPoint } from '../telemetry.mapper';

const basePoint: LiveTelemetryPoint = {
  deviceId: 'dev-1',
  vehicleId: 'veh-1',
  tripId: 'trip-1',
  timestamp: 1000,
  lat: -6.889,
  lng: -38.561,
  speedKmh: 36,
  satellites: 8,
  hdop: 1.2,
  accelX: 1.5,
  accelY: -2,
  accelZ: 9.8,
  gyroX: 0.1,
  gyroY: 0.2,
  gyroZ: 0.3,
  hardAcceleration: false,
  hardBrake: false,
  sharpTurn: false,
  impactSuspected: false,
  batteryPct: 90,
};

describe('toSimPayload (contrato v1.0 → shape do Nathan)', () => {
  it('mapeia sensores e gps com conversão de km/h para m/s', () => {
    const out = toSimPayload(basePoint);

    expect(out.deviceId).toBe('dev-1');
    expect(out.timestamp).toBe(1000);
    expect(out.sensors).toEqual({
      accelX: 1.5,
      accelY: -2,
      accelZ: 9.8,
      gyroX: 0.1,
      gyroY: 0.2,
      gyroZ: 0.3,
    });
    expect(out.gps.latitude).toBe(-6.889);
    expect(out.gps.longitude).toBe(-38.561);
    expect(out.gps.speed).toBeCloseTo(10, 5); // 36 km/h = 10 m/s
    expect(out.gps.heading).toBe(0);
  });

  it('GPS ausente vira (0,0) com velocidade 0 (aciona GPS_LOSS)', () => {
    const out = toSimPayload({
      ...basePoint,
      lat: null,
      lng: null,
      speedKmh: null,
    });

    expect(out.gps.latitude).toBe(0);
    expect(out.gps.longitude).toBe(0);
    expect(out.gps.speed).toBe(0);
  });
});
