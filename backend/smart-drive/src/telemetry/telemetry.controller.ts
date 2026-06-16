import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { DeviceStatusDto } from './dto/device-status.dto';
import { TelemetryPayloadDto } from './dto/telemetry-payload.dto';
import { TelemetryGateway } from './telemetry.gateway';
import { toLivePoint } from './telemetry.mapper';

/**
 * ⚠️ TEMPORÁRIO / DEV. O `POST /telemetry` real (persistência + ingestão) é do
 * Pedro (PED-RF-06) e ainda não existe. Este controller só valida o payload no
 * contrato v1.0 e dispara o gateway WebSocket, para desenvolver/testar o front
 * em tempo real sem hardware. Quando o endpoint do Pedro chegar, ele deve
 * chamar `TelemetryGateway.emitTelemetryNew` após persistir, e este controller
 * (ou ao menos a rota /telemetry) é removido.
 */
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly gateway: TelemetryGateway) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  ingest(@Body() dto: TelemetryPayloadDto): { ok: true; tripId: string } {
    const point = toLivePoint(dto);
    this.gateway.emitTelemetryNew(point);
    return { ok: true, tripId: point.tripId };
  }

  @Post('dev/device-status')
  @HttpCode(HttpStatus.ACCEPTED)
  deviceStatus(@Body() dto: DeviceStatusDto): { ok: true } {
    const { tripId, ...change } = dto;
    this.gateway.emitDeviceStatusChanged(tripId, change);
    return { ok: true };
  }
}
