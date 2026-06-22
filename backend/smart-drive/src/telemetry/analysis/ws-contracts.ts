/**
 * Contratos dos eventos WebSocket de analytics, espelhando o que o frontend
 * consome em `frontend/.../features/shared/types/{event,score}.ts`. O gateway é
 * a fronteira: o orquestrador traduz os tipos internos do Nathan (detectores/
 * score) para ESTES shapes antes de emitir. Manter em sincronia com o front.
 */

export enum WsDrivingEventType {
  HARD_ACCELERATION = 'HARD_ACCELERATION',
  HARD_BRAKE = 'HARD_BRAKE',
  SHARP_TURN = 'SHARP_TURN',
  IMPACT_SUSPECTED = 'IMPACT_SUSPECTED',
  SPEED_SPIKE = 'SPEED_SPIKE',
  GPS_LOST = 'GPS_LOST',
  DEVICE_DISCONNECTED = 'DEVICE_DISCONNECTED',
}

export enum WsEventSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/** Evento de condução emitido em `trip:eventDetected`. */
export interface WsDrivingEvent {
  id: string;
  tripId: string;
  type: WsDrivingEventType;
  severity: WsEventSeverity;
  timestamp: string; // ISO-8601
  lat?: number;
  lng?: number;
  value: number;
  threshold: number;
  description: string;
}

export enum WsScoreClassification {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE',
  CRITICAL = 'CRITICAL',
}

export interface WsScorePenalties {
  hardAccelerations: number;
  hardBrakes: number;
  sharpTurns: number;
  impactsSuspected: number;
  speedInstability: number;
}

/** Score de condução emitido em `trip:scoreUpdated`. */
export interface WsDrivingScore {
  value: number;
  classification: WsScoreClassification;
  penalties: WsScorePenalties;
}

/**
 * Estimativa de consumo emitida em `trip:fuelEstimateUpdated`. Espelha
 * `frontend/.../features/shared/types/fuel.ts` (FuelEstimate). O consumo
 * ajustado vem do FuelEstimationService (Nathan); litros e confiança são
 * derivados aqui no orquestrador a partir da distância acumulada na viagem.
 */
export interface WsFuelEstimate {
  id: string;
  tripId: string;
  baseConsumptionKmL: number;
  adjustedConsumptionKmL: number;
  estimatedLitersSpent: number;
  estimatedCost?: number;
  confidenceLevel: number; // 0..1
  modelVersion: string;
}
