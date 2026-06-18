import { Module } from '@nestjs/common';
import { TelemetryController } from './telemetry.controller';
import { TelemetryGateway } from './telemetry.gateway';
import { AnalysisOrchestratorService } from './analysis/analysis-orchestrator.service';

// Gateway WebSocket (JOA-RF-03/EPIC-04). A ingestão real é do Pedro (PED-RF-06);
// TelemetryController aqui é o disparo mock/dev temporário. TelemetryGateway e
// AnalysisOrchestratorService são exportados para que outros módulos (ex: Demo)
// possam emitir telemetria/analytics e gerir o estado de análise por viagem.
@Module({
  controllers: [TelemetryController],
  providers: [TelemetryGateway, AnalysisOrchestratorService],
  exports: [TelemetryGateway, AnalysisOrchestratorService],
})
export class TelemetryModule {}
