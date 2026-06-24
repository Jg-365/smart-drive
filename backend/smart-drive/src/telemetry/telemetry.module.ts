import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { AnalysisOrchestratorService } from './analysis/analysis-orchestrator.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetryIngestionService } from './telemetry-ingestion.service';
import { TelemetryQueryService } from './telemetry-query.service';

@Module({
  imports: [DevicesModule],
  controllers: [TelemetryController],
  providers: [TelemetryGateway, AnalysisOrchestratorService, TelemetryIngestionService, TelemetryQueryService],
  exports: [TelemetryGateway, AnalysisOrchestratorService, TelemetryIngestionService, TelemetryQueryService],
})
export class TelemetryModule {}
