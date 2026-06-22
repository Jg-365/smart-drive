import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DrivingEventDetectorService } from '../../driving-analysis/services/driving-event-detector.service';
import { DrivingScoreService } from '../../driving-score/driving-score.service';
import { DrivingEventType } from '../../driving-analysis/enums/driving-event-type.enum';
import type { DrivingEvent } from '../../driving-analysis/interfaces/driving-event.interface';
import { FuelEstimationService } from '../../fuel-estimation/fuel-estimation.service';
import type { TelemetryPayload } from '../../telemetry-simulator/interfaces/telemetry.interface';
import type { LiveTelemetryPoint } from '../telemetry.mapper';
import { TelemetryGateway } from '../telemetry.gateway';
import { toSimPayload } from './input.mapper';
import {
  WsDrivingEvent,
  WsDrivingEventType,
  WsDrivingScore,
  WsEventSeverity,
  WsFuelEstimate,
  WsScoreClassification,
  WsScorePenalties,
} from './ws-contracts';

/**
 * Consumo base (km/l) usado quando a viagem não informa o do veículo. Mantém o
 * cálculo honesto (multiplicador * base) mesmo sem o cadastro do veículo.
 */
const DEFAULT_BASE_CONSUMPTION_KM_L = 12;

/** A cada N pontos recalcula e emite a estimativa de consumo. */
const FUEL_BATCH_SIZE = 10;

/** Versão do modelo determinístico de consumo (para rastreio no relatório). */
const FUEL_MODEL_VERSION = 'fuel-heuristic-v1';

/** Pontos de GPS válidos para a confiança da estimativa chegar a 1.0. */
const CONFIDENCE_FULL_AT_GPS_POINTS = 60;

const EARTH_RADIUS_KM = 6371;

/** Distância em km entre dois pontos lat/lng (haversine). */
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Converte o ponto normalizado para o shape que o FuelEstimationService consome.
 * Diferente de `toSimPayload`, a velocidade fica em km/h (o estimador usa
 * limiares em km/h: SPEED_ECO_MIN=60, >110, <15).
 */
function toFuelPayload(point: LiveTelemetryPoint): TelemetryPayload {
  return {
    deviceId: point.deviceId,
    timestamp: point.timestamp,
    sensors: {
      accelX: point.accelX,
      accelY: point.accelY,
      accelZ: point.accelZ,
      gyroX: point.gyroX,
      gyroY: point.gyroY,
      gyroZ: point.gyroZ,
    },
    gps: {
      latitude: point.lat ?? 0,
      longitude: point.lng ?? 0,
      speed: point.speedKmh ?? 0,
      heading: 0,
    },
  };
}

/** Faixa do score (mesmas bandas do DrivingScoreService) → enum do contrato WS. */
function classifyScore(value: number): WsScoreClassification {
  if (value > 85) return WsScoreClassification.EXCELLENT;
  if (value > 70) return WsScoreClassification.GOOD;
  if (value > 60) return WsScoreClassification.MODERATE;
  if (value > 40) return WsScoreClassification.AGGRESSIVE;
  return WsScoreClassification.CRITICAL;
}

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
  fuel: FuelEstimationService;
  baseConsumptionKmL: number;
  /** Contagem acumulada de penalidades para o contrato de score do front. */
  penalties: WsScorePenalties;
  /** Lote de telemetria desde a última emissão de consumo. */
  fuelBuffer: TelemetryPayload[];
  /** Distância acumulada da viagem (km) via GPS, para estimar litros. */
  distanceKm: number;
  /** Último ponto de GPS válido (para a distância incremental). */
  lastGps: { lat: number; lng: number } | null;
  /** Pontos de GPS válidos vistos (para a confiança da estimativa). */
  gpsPointCount: number;
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

  private getOrCreate(
    tripId: string,
    baseConsumptionKmL = DEFAULT_BASE_CONSUMPTION_KM_L,
  ): TripAnalysis {
    let analysis = this.trips.get(tripId);
    if (!analysis) {
      analysis = {
        detector: new DrivingEventDetectorService(),
        score: new DrivingScoreService(),
        fuel: new FuelEstimationService(baseConsumptionKmL),
        baseConsumptionKmL,
        penalties: {
          hardAccelerations: 0,
          hardBrakes: 0,
          sharpTurns: 0,
          impactsSuspected: 0,
          speedInstability: 0,
        },
        fuelBuffer: [],
        distanceKm: 0,
        lastGps: null,
        gpsPointCount: 0,
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
  process(
    tripId: string,
    point: LiveTelemetryPoint,
    baseConsumptionKmL?: number,
  ): WsDrivingEvent[] {
    const analysis = this.getOrCreate(tripId, baseConsumptionKmL);
    const { detector } = analysis;
    const raw = detector.detect(toSimPayload(point));

    const events = raw.map((e) => this.enrich(tripId, point, e));

    // Não há detector de impacto; o firmware marca a flag no pacote (v1.0).
    if (point.impactSuspected) {
      events.push(this.impactEvent(tripId, point));
    }

    for (const event of events) {
      this.gateway.emitEventDetected(event);
    }

    this.updateAndEmitScore(tripId, analysis, raw, events);
    this.updateAndEmitFuel(tripId, analysis, point);

    return events;
  }

  /**
   * Atualiza o score da viagem (DrivingScoreService do Nathan — estado mutável
   * por viagem) e emite `trip:scoreUpdated` no contrato do front. A classificação
   * é derivada do valor (mesmas bandas do serviço) e as penalidades são contadas
   * cumulativamente a partir dos eventos emitidos.
   */
  private updateAndEmitScore(
    tripId: string,
    analysis: TripAnalysis,
    raw: DrivingEvent[],
    events: WsDrivingEvent[],
  ): void {
    for (const event of events) {
      this.countPenalty(analysis.penalties, event.type);
    }

    const result = analysis.score.calculate(raw);
    const score: WsDrivingScore = {
      value: result.value,
      classification: classifyScore(result.value),
      penalties: { ...analysis.penalties },
    };
    this.gateway.emitScoreUpdated(tripId, score);
  }

  private countPenalty(
    penalties: WsScorePenalties,
    type: WsDrivingEventType,
  ): void {
    switch (type) {
      case WsDrivingEventType.HARD_ACCELERATION:
        penalties.hardAccelerations += 1;
        break;
      case WsDrivingEventType.HARD_BRAKE:
        penalties.hardBrakes += 1;
        break;
      case WsDrivingEventType.SHARP_TURN:
        penalties.sharpTurns += 1;
        break;
      case WsDrivingEventType.IMPACT_SUSPECTED:
        penalties.impactsSuspected += 1;
        break;
      default:
        break;
    }
  }

  /**
   * Acumula a distância da viagem (GPS) e, a cada lote de FUEL_BATCH_SIZE pontos,
   * pede ao FuelEstimationService (Nathan) o consumo ajustado e emite
   * `trip:fuelEstimateUpdated`. Litros e confiança são derivados aqui.
   */
  private updateAndEmitFuel(
    tripId: string,
    analysis: TripAnalysis,
    point: LiveTelemetryPoint,
  ): void {
    if (point.lat != null && point.lng != null) {
      const current = { lat: point.lat, lng: point.lng };
      if (analysis.lastGps) {
        analysis.distanceKm += haversineKm(analysis.lastGps, current);
      }
      analysis.lastGps = current;
      analysis.gpsPointCount += 1;
    }

    analysis.fuelBuffer.push(toFuelPayload(point));
    if (analysis.fuelBuffer.length < FUEL_BATCH_SIZE) return;

    const adjustedConsumptionKmL = analysis.fuel.calculate(analysis.fuelBuffer);
    analysis.fuelBuffer = [];

    const estimatedLitersSpent =
      adjustedConsumptionKmL > 0
        ? Number((analysis.distanceKm / adjustedConsumptionKmL).toFixed(2))
        : 0;
    const confidenceLevel = Number(
      Math.min(
        1,
        analysis.gpsPointCount / CONFIDENCE_FULL_AT_GPS_POINTS,
      ).toFixed(2),
    );

    const estimate: WsFuelEstimate = {
      id: randomUUID(),
      tripId,
      baseConsumptionKmL: analysis.baseConsumptionKmL,
      adjustedConsumptionKmL,
      estimatedLitersSpent,
      confidenceLevel,
      modelVersion: FUEL_MODEL_VERSION,
    };
    this.gateway.emitFuelEstimateUpdated(tripId, estimate);
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
