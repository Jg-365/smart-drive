import { Injectable, Logger } from '@nestjs/common';
import { DrivingEventDetectorService } from '../../driving-analysis/services/driving-event-detector.service';
import { DrivingScoreService } from '../../driving-score/driving-score.service';
import type { DrivingEvent } from '../../driving-analysis/interfaces/driving-event.interface';
import type { LiveTelemetryPoint } from '../telemetry.mapper';
import { toSimPayload } from './input.mapper';

/**
 * Estado de análise de UMA viagem. Detectores e score são MUTÁVEIS por natureza
 * (SharpTurnDetector guarda o último ponto; DrivingScoreService acumula o score),
 * então cada viagem recebe instâncias próprias — nunca compartilhadas entre
 * viagens. Por isso o orquestrador instancia via `new` por `tripId` em vez de
 * injetar os serviços como providers singleton.
 */
interface TripAnalysis {
  detector: DrivingEventDetectorService;
  score: DrivingScoreService;
}

/**
 * Orquestra a análise de telemetria por viagem: mapeia o ponto do contrato v1.0
 * para o shape dos detectores do Nathan, roda detecção + score com estado
 * isolado por `tripId`, e devolve os resultados crus para o boundary
 * (controller/simulador) traduzir e emitir via gateway.
 *
 * EPIC-INT-00 entrega o ciclo de vida e o processamento; a tradução para os
 * contratos WS e a emissão entram em INT-01 (eventos) e INT-02 (score).
 */
@Injectable()
export class AnalysisOrchestratorService {
  private readonly logger = new Logger(AnalysisOrchestratorService.name);
  private readonly trips = new Map<string, TripAnalysis>();

  private getOrCreate(tripId: string): TripAnalysis {
    let analysis = this.trips.get(tripId);
    if (!analysis) {
      analysis = {
        detector: new DrivingEventDetectorService(),
        score: new DrivingScoreService(),
      };
      this.trips.set(tripId, analysis);
      this.logger.debug(`Análise iniciada para a viagem ${tripId}`);
    }
    return analysis;
  }

  /**
   * Processa um ponto de telemetria de uma viagem: roda os detectores e o score
   * com o estado isolado dessa viagem. Retorna os eventos crus detectados nesse
   * ponto (a serem enriquecidos/emitidos pelo chamador em INT-01).
   */
  process(tripId: string, point: LiveTelemetryPoint): DrivingEvent[] {
    const { detector } = this.getOrCreate(tripId);
    const payload = toSimPayload(point);
    return detector.detect(payload);
  }

  /** Libera o estado de uma viagem encerrada (evita vazamento de memória). */
  endTrip(tripId: string): void {
    if (this.trips.delete(tripId)) {
      this.logger.debug(`Análise encerrada para a viagem ${tripId}`);
    }
  }

  /** Apenas para testes: quantas viagens com estado ativo. */
  activeTripCount(): number {
    return this.trips.size;
  }
}
