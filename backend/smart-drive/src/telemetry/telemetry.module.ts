import { Module } from '@nestjs/common';
import { TelemetryController } from './telemetry.controller';
import { TelemetryGateway } from './telemetry.gateway';

// Gateway WebSocket (JOA-RF-03/EPIC-04). A ingestão real é do Pedro (PED-RF-06);
// TelemetryController aqui é o disparo mock/dev temporário. TelemetryGateway é
// exportado para que outros módulos (ex: Demo) possam emitir eventos.
@Module({
  controllers: [TelemetryController],
  providers: [TelemetryGateway],
  exports: [TelemetryGateway],
})
export class TelemetryModule {}
