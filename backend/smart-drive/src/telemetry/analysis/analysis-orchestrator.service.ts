import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DrivingEventDetectorService } from '../../driving-analysis/services/driving-event-detector.service';
import { DrivingScoreService } from '../../driving-score/driving-score.service';
import { DrivingEventType } from '../../driving-analysis/enums/driving-event-type.enum';
import type { DrivingEvent } from '../../driving-analysis/interfaces/driving-event.interface';
import type { LiveTelemetryPoint } from '../telemetry.mapper';
import { TelemetryGateway } from '../telemetry.gateway';
import { toSimPayload } from './input.mapper';
import {
  WsDrivingEvent,
  WsDrivingEventType,
  WsEventSeverity,
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
   * estado isolado dessa viagem, enriquece os eventos para o contrato WS,
   * sintetiza IMPACT_SUSPECTED a partir da flag do firmware e os emite.
   * Retorna os eventos emitidos (útil para testes/score).
   */
  process(tripId: string, point: LiveTelemetryPoint): WsDrivingEvent[] {
    const { detector } = this.getOrCreate(tripId);
    const raw = detector.detect(toSimPayload(point));

    const events = raw.map((e) => this.enrich(tripId, point, e));

    // Não há detector de impacto; o firmware marca a flag no pacote (v1.0).
    if (point.impactSuspected) {
      events.push(this.impactEvent(tripId, point));
    }

    for (const event of events) {
      this.gateway.emitEventDetected(event);
    }
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

  private impactEvent(
    tripId: string,
    point: LiveTelemetryPoint,
  ): WsDrivingEvent {
    const magnitude = Math.hypot(point.accelX, point.accelY, point.accelZ);
    return {
      id: randomUUID(),
      tripId,
      type: WsDrivingEventType.IMPACT_SUSPECTED,
      severity: WsEventSeverity.CRITICAL,
      timestamp: new Date(point.timestamp).toISOString(),
      lat: point.lat ?? undefined,
      lng: point.lng ?? undefined,
      value: magnitude,
      threshold: 0,
      description: EVENT_DESCRIPTION[WsDrivingEventType.IMPACT_SUSPECTED],
    };
  }
}
