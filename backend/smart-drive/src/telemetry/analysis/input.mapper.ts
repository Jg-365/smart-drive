import type { LiveTelemetryPoint } from '../telemetry.mapper';
import type { TelemetryPayload } from '../../telemetry-simulator/interfaces/telemetry.interface';

const KMH_TO_MS = 1 / 3.6;

/**
 * Converte o ponto de telemetria normalizado (contrato v1.0 achatado,
 * `LiveTelemetryPoint`) para o shape que os detectores/score do Nathan
 * consomem (`TelemetryPayload` com `sensors`/`gps` aninhados).
 *
 * Notas de conversão:
 * - `speed` dos detectores está em m/s (ex.: SharpTurnDetector.MIN_SPEED = 3 m/s);
 *   `speedKmh` do contrato é km/h → divide por 3.6.
 * - `heading` não existe no contrato v1.0 (o firmware não envia rumo); fica 0.
 *   A detecção de curva por GPS (que usa heading) degrada, mas a inercial (giro
 *   + accel lateral) segue funcionando.
 * - GPS ausente (lat/lng null) vira (0,0) — exatamente o que o GpsLossDetector
 *   espera para acusar perda de sinal.
 */
export function toSimPayload(point: LiveTelemetryPoint): TelemetryPayload {
  return {
    deviceId: point.deviceId,
    timestamp: point.timestamp,
    sensors: {
      accelX: point.accelX,
      accelY: point.accelY,
      accelZ: point.accelZ,
      gyroX: point.gyroX,
      gyroY: point.gyroY,
      gyroZ: point.gyroZ,
    },
    gps: {
      latitude: point.lat ?? 0,
      longitude: point.lng ?? 0,
      speed: point.speedKmh != null ? point.speedKmh * KMH_TO_MS : 0,
      heading: 0,
    },
  };
}

const MS_TO_KMH = 3.6;

/**
 * Converte um ponto gerado pelo simulador (`TelemetryPayload`) para o contrato
 * v1.0 achatado (`LiveTelemetryPoint`) que o gateway emite e o orquestrador
 * processa, carimbando a viagem/veículo da sessão demo.
 */
export function toLivePointFromSim(
  payload: TelemetryPayload,
  ctx: { tripId: string; vehicleId: string },
): LiveTelemetryPoint {
  return {
    deviceId: payload.deviceId,
    vehicleId: ctx.vehicleId,
    tripId: ctx.tripId,
    timestamp: payload.timestamp,
    lat: payload.gps.latitude,
    lng: payload.gps.longitude,
    speedKmh: payload.gps.speed * MS_TO_KMH,
    satellites: null,
    hdop: null,
    accelX: payload.sensors.accelX,
    accelY: payload.sensors.accelY,
    accelZ: payload.sensors.accelZ,
    gyroX: payload.sensors.gyroX,
    gyroY: payload.sensors.gyroY,
    gyroZ: payload.sensors.gyroZ,
    hardAcceleration: false,
    hardBrake: false,
    sharpTurn: false,
    impactSuspected: false,
    batteryPct: null,
  };
}
