import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { AnalysisOrchestratorService } from './analysis/analysis-orchestrator.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetryIngestionService } from './telemetry-ingestion.service';

@Module({
  imports: [DevicesModule],
  controllers: [TelemetryController],
  providers: [TelemetryGateway, AnalysisOrchestratorService, TelemetryIngestionService],
  exports: [TelemetryGateway, AnalysisOrchestratorService, TelemetryIngestionService],
})
export class TelemetryModule {}
