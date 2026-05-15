export enum ScoreClassification {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE',
  CRITICAL = 'CRITICAL',
}

export interface ScorePenalties {
  hardAccelerations: number
  hardBrakes: number
  sharpTurns: number
  impactsSuspected: number
  speedInstability: number
}

export interface DrivingScore {
  value: number
  classification: ScoreClassification
  penalties: ScorePenalties
}
