import { Module } from '@nestjs/common';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { TelemetrySimulatorModule } from '../telemetry-simulator/telemetry-simulator.module';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';

// Modo demo (JOA-RF-05 / EPIC-INT-03): dirige o simulador do Nathan ao vivo
// pelo gateway + orquestrador de análise (ambos do TelemetryModule).
@Module({
  imports: [TelemetryModule, TelemetrySimulatorModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
