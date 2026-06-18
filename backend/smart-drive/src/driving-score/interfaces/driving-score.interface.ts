// Alinhado com o contrato do frontend (features/shared/types/score.ts):
// classificação como enum e penalidades como contagens acumuladas por viagem.

export enum ScoreClassification {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE',
  CRITICAL = 'CRITICAL',
}

export interface ScorePenalties {
  hardAccelerations: number;
  hardBrakes: number;
  sharpTurns: number;
  impactsSuspected: number;
  speedInstability: number;
}

export interface DrivingScore {
  value: number;
  classification: ScoreClassification;
  penalties: ScorePenalties;
}
