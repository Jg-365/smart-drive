import { Injectable } from '@nestjs/common';
import { DrivingEventType } from 'src/driving-analysis/enums/driving-event-type.enum';
import { DrivingEvent } from 'src/driving-analysis/interfaces/driving-event.interface';
import {
  DrivingScore,
  ScoreClassification,
  ScorePenalties,
} from './interfaces/driving-score.interface';

/**
 * Score de condução por viagem. O estado (score corrente + contagem de
 * penalidades) é por INSTÂNCIA — o AnalysisOrchestratorService cria uma
 * instância por `tripId` (via `new`, não como provider singleton), garantindo
 * que viagens não compartilhem score.
 */
@Injectable()
export class DrivingScoreService {
  private score = 100;

  // Taxa de recuperação gradual quando não há eventos agressivos.
  private readonly RECOVERY_STEP = 1;

  // Penalidades acumuladas no decorrer da viagem (contrato do front).
  private readonly penalties: ScorePenalties = {
    hardAccelerations: 0,
    hardBrakes: 0,
    sharpTurns: 0,
    impactsSuspected: 0,
    speedInstability: 0,
  };

  calculate(events: DrivingEvent[]): DrivingScore {
    if (events.length > 0) {
      for (const event of events) {
        this.score -= this.calculatePenalty(event);
        this.clampScore();
        this.countPenalty(event);
      }
    } else {
      // Sem eventos agressivos no ponto → recuperação gradual respeitando tetos.
      this.recoverGradually();
    }

    return {
      value: this.score,
      classification: this.getClassification(this.score),
      penalties: { ...this.penalties },
    };
  }

  private calculatePenalty(event: DrivingEvent): number {
    switch (event.type) {
      case DrivingEventType.HARD_ACCELERATION:
        return 2.5 * event.severity;
      case DrivingEventType.HARD_BRAKE:
        return 3.5 * event.severity;
      case DrivingEventType.SHARP_TURN:
        return 2 * event.severity;
      case DrivingEventType.IMPACT_SUSPECTED:
        // Impacto é crítico; penalidade pesada (rever pesos com o Nathan).
        return 8 * event.severity;
      default:
        return 0; // GPS_LOST não penaliza o score.
    }
  }

  private countPenalty(event: DrivingEvent): void {
    switch (event.type) {
      case DrivingEventType.HARD_ACCELERATION:
        this.penalties.hardAccelerations += 1;
        break;
      case DrivingEventType.HARD_BRAKE:
        this.penalties.hardBrakes += 1;
        break;
      case DrivingEventType.SHARP_TURN:
        this.penalties.sharpTurns += 1;
        break;
      case DrivingEventType.IMPACT_SUSPECTED:
        this.penalties.impactsSuspected += 1;
        break;
      default:
        break;
    }
  }

  // Recuperação gradual respeitando o teto máximo do score atual.
  private recoverGradually(): void {
    const ceiling = this.getRecoveryCeiling(this.score);
    if (this.score < ceiling) {
      this.score = Math.min(ceiling, this.score + this.RECOVERY_STEP);
    }
  }

  // Teto máximo que o motorista pode recuperar a partir do score atual.
  private getRecoveryCeiling(currentScore: number): number {
    if (currentScore > 75) return 100;
    if (currentScore > 60) return 75;
    return 60;
  }

  private clampScore(): void {
    this.score = Math.max(0, Math.min(100, this.score));
  }

  private getClassification(score: number): ScoreClassification {
    if (score > 85) return ScoreClassification.EXCELLENT;
    if (score > 70) return ScoreClassification.GOOD;
    if (score > 60) return ScoreClassification.MODERATE;
    if (score > 40) return ScoreClassification.AGGRESSIVE;
    return ScoreClassification.CRITICAL;
  }
}
