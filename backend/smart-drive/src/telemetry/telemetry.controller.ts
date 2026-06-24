import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { DeviceStatusDto } from './dto/device-status.dto';
import { TelemetryPayloadDto } from './dto/telemetry-payload.dto';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetryIngestionService } from './telemetry-ingestion.service';
import { TelemetryQueryService } from './telemetry-query.service';

@Controller('telemetry')
export class TelemetryController {
  constructor(
    private readonly gateway: TelemetryGateway,
    private readonly ingestionService: TelemetryIngestionService,
    private readonly queryService: TelemetryQueryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  ingest(@Body() dto: TelemetryPayloadDto) {
    return this.ingestionService.ingest(dto);
  }

  @Post('dev/device-status')
  @HttpCode(HttpStatus.ACCEPTED)
  deviceStatus(@Body() dto: DeviceStatusDto): { ok: true } {
    const { tripId, ...change } = dto;
    this.gateway.emitDeviceStatusChanged(tripId, change);
    return { ok: true };
  }

  @Get('live')
  live() {
    return this.queryService.findLatest();
  }
}
