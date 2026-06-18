import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DrivingEventDetectorService } from '../../driving-analysis/services/driving-event-detector.service';
import { DrivingScoreService } from '../../driving-score/driving-score.service';
import { DrivingEventType } from '../../driving-analysis/enums/driving-event-type.enum';
import type { DrivingEvent } from '../../driving-analysis/interfaces/driving-event.interface';
import {
  DrivingScore,
  ScoreClassification,
} from '../../driving-score/interfaces/driving-score.interface';
import type { LiveTelemetryPoint } from '../telemetry.mapper';
import { TelemetryGateway } from '../telemetry.gateway';
import { toSimPayload } from './input.mapper';
import {
  WsDrivingEvent,
  WsDrivingEventType,
  WsDrivingScore,
  WsEventSeverity,
  WsScoreClassification,
} from './ws-contracts';

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

/** Tipos do detector (Nathan) → tipos do contrato WS (front). Nomes coincidem. */
const EVENT_TYPE_MAP: Record<DrivingEventType, WsDrivingEventType> = {
  [DrivingEventType.HARD_ACCELERATION]: WsDrivingEventType.HARD_ACCELERATION,
  [DrivingEventType.HARD_BRAKE]: WsDrivingEventType.HARD_BRAKE,
  [DrivingEventType.SHARP_TURN]: WsDrivingEventType.SHARP_TURN,
  [DrivingEventType.IMPACT_SUSPECTED]: WsDrivingEventType.IMPACT_SUSPECTED,
  [DrivingEventType.GPS_LOST]: WsDrivingEventType.GPS_LOST,
};

const EVENT_DESCRIPTION: Record<WsDrivingEventType, string> = {
  [WsDrivingEventType.HARD_ACCELERATION]: 'Aceleração brusca',
  [WsDrivingEventType.HARD_BRAKE]: 'Frenagem brusca',
  [WsDrivingEventType.SHARP_TURN]: 'Curva acentuada',
  [WsDrivingEventType.IMPACT_SUSPECTED]: 'Suspeita de impacto',
  [WsDrivingEventType.SPEED_SPIKE]: 'Pico de velocidade',
  [WsDrivingEventType.GPS_LOST]: 'Sinal de GPS perdido',
  [WsDrivingEventType.DEVICE_DISCONNECTED]: 'Dispositivo desconectado',
};

/**
 * Converte a severidade numérica do detector (razão medido/limiar, ≥1 quando
 * dispara) em faixa qualitativa do contrato do front.
 */
function toSeverityBucket(severity: number): WsEventSeverity {
  if (severity >= 4) return WsEventSeverity.CRITICAL;
  if (severity >= 2.5) return WsEventSeverity.HIGH;
  if (severity >= 1.5) return WsEventSeverity.MEDIUM;
  return WsEventSeverity.LOW;
}

/** Severidade numérica atribuída ao impacto sintetizado (→ faixa CRITICAL). */
const IMPACT_SEVERITY = 4;

/** Classificação do score (Nathan) → classificação do contrato WS (front). */
const SCORE_CLASS_MAP: Record<ScoreClassification, WsScoreClassification> = {
  [ScoreClassification.EXCELLENT]: WsScoreClassification.EXCELLENT,
  [ScoreClassification.GOOD]: WsScoreClassification.GOOD,
  [ScoreClassification.MODERATE]: WsScoreClassification.MODERATE,
  [ScoreClassification.AGGRESSIVE]: WsScoreClassification.AGGRESSIVE,
  [ScoreClassification.CRITICAL]: WsScoreClassification.CRITICAL,
};

/**
 * Orquestra a análise de telemetria por viagem: mapeia o ponto do contrato v1.0
 * para o shape dos detectores do Nathan, roda detecção com estado isolado por
 * `tripId`, enriquece cada evento para o contrato WS e emite via gateway.
 * O score (EPIC-INT-02) entra a seguir, reusando o mesmo estado por viagem.
 */
@Injectable()
export class AnalysisOrchestratorService {
  private readonly logger = new Logger(AnalysisOrchestratorService.name);
  private readonly trips = new Map<string, TripAnalysis>();

  constructor(private readonly gateway: TelemetryGateway) {}

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
   * Processa um ponto de telemetria de uma viagem: roda os detectores com o
   * estado isolado dessa viagem, sintetiza IMPACT_SUSPECTED a partir da flag do
   * firmware, emite cada evento (trip:eventDetected) e o score acumulado
   * (trip:scoreUpdated). Retorna os eventos emitidos (útil para testes).
   */
  process(tripId: string, point: LiveTelemetryPoint): WsDrivingEvent[] {
    const { detector, score } = this.getOrCreate(tripId);

    const raw = detector.detect(toSimPayload(point));
    // Não há detector de impacto; o firmware marca a flag no pacote (v1.0).
    if (point.impactSuspected) {
      raw.push(this.rawImpactEvent(point));
    }

    const events = raw.map((e) => this.enrich(tripId, point, e));
    for (const event of events) {
      this.gateway.emitEventDetected(event);
    }

    // O score consome os MESMOS eventos crus (inclui o impacto sintetizado) e
    // acumula por viagem; sem eventos, recupera gradualmente.
    const scoreResult = score.calculate(raw);
    this.gateway.emitScoreUpdated(tripId, this.toWsScore(scoreResult));

    return events;
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

  private enrich(
    tripId: string,
    point: LiveTelemetryPoint,
    raw: DrivingEvent,
  ): WsDrivingEvent {
    const type = EVENT_TYPE_MAP[raw.type];
    return {
      id: randomUUID(),
      tripId,
      type,
      severity: toSeverityBucket(raw.severity),
      timestamp: new Date(raw.timestamp).toISOString(),
      lat: point.lat ?? undefined,
      lng: point.lng ?? undefined,
      value: raw.measuredValue,
      threshold: raw.threshold,
      description: EVENT_DESCRIPTION[type],
    };
  }

  /** Evento cru de impacto a partir da flag do firmware (alimenta score+emit). */
  private rawImpactEvent(point: LiveTelemetryPoint): DrivingEvent {
    return {
      type: DrivingEventType.IMPACT_SUSPECTED,
      measuredValue: Math.hypot(point.accelX, point.accelY, point.accelZ),
      threshold: 0,
      timestamp: point.timestamp,
      severity: IMPACT_SEVERITY,
    };
  }

  private toWsScore(score: DrivingScore): WsDrivingScore {
    return {
      value: score.value,
      classification: SCORE_CLASS_MAP[score.classification],
      penalties: { ...score.penalties },
    };
  }
}
