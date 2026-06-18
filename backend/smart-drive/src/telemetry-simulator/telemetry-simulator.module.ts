import { Module } from '@nestjs/common';
import { TelemetrySimulatorService } from './telemetry-simulator.service';

@Module({
  providers: [TelemetrySimulatorService],
  exports: [TelemetrySimulatorService]
})
export class TelemetrySimulatorModule {}
