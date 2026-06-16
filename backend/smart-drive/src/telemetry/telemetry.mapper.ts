import type { TelemetryPayloadDto } from './dto/telemetry-payload.dto';

/**
 * Ponto de telemetria normalizado emitido no evento `telemetry:new`.
 * Achatado a partir do contrato v1.0 (gps/imu aninhados) para o formato que o
 * frontend consome (features/shared/types/TelemetryPoint + flags de evento).
 * `tripId` deriva de `sessionId` (a sessão é a viagem ativa no contrato).
 */
export interface LiveTelemetryPoint {
  deviceId: string;
  vehicleId: string;
  tripId: string;
  timestamp: number;
  lat: number | null;
  lng: number | null;
  speedKmh: number | null;
  satellites: number | null;
  hdop: number | null;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  hardAcceleration: boolean;
  hardBrake: boolean;
  sharpTurn: boolean;
  impactSuspected: boolean;
  batteryPct: number | null;
}

export function toLivePoint(p: TelemetryPayloadDto): LiveTelemetryPoint {
  return {
    deviceId: p.deviceId,
    vehicleId: p.vehicleId,
    tripId: p.sessionId,
    timestamp: p.timestamp,
    lat: p.gps?.lat ?? null,
    lng: p.gps?.lng ?? null,
    speedKmh: p.gps?.speedKmh ?? null,
    satellites: p.gps?.satellites ?? null,
    hdop: p.gps?.hdop ?? null,
    accelX: p.imu.accelX,
    accelY: p.imu.accelY,
    accelZ: p.imu.accelZ,
    gyroX: p.imu.gyroX ?? 0,
    gyroY: p.imu.gyroY ?? 0,
    gyroZ: p.imu.gyroZ ?? 0,
    hardAcceleration: p.events?.hardAcceleration ?? false,
    hardBrake: p.events?.hardBrake ?? false,
    sharpTurn: p.events?.sharpTurn ?? false,
    impactSuspected: p.events?.impactSuspected ?? false,
    batteryPct: p.battery?.percentage ?? null,
  };
}
