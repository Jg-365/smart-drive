import { Injectable } from '@nestjs/common';
import { DrivingEventType } from 'src/driving-analysis/enums/driving-event-type.enum';
import { DrivingEvent } from 'src/driving-analysis/interfaces/driving-event.interface';

@Injectable()
export class DrivingScoreService {
  // 1. O score agora é uma propriedade da classe e começa em 100
  private score = 100;
  
  // Taxa de recuperação gradual quando não há eventos agressivos
  private readonly RECOVERY_STEP = 1; 

  calculate(events: DrivingEvent[]) {
    const penalties: { eventType: DrivingEventType; pointsLost: number }[] = [];

    if (events.length > 0) {
      // Processa as penalidades se houverem eventos agressivos
      for (const event of events) {
        const pointsLost = this.calculatePenalty(event);
        
        this.score -= pointsLost;
        this.clampScore(); // Garante que não fique abaixo de 0

        penalties.push({
          eventType: event.type,
          pointsLost,
        });
      }
    } else {
      // 2. Se nenhuma penalidade for detectada, aplica a recuperação gradual baseado nos tetos
      this.recoverGradually();
    }

    return {
      value: this.score,
      classification: this.getClassification(this.score),
      penalties,
    };
  }

  private calculatePenalty(event: DrivingEvent): number {
    switch (event.type) {
      case DrivingEventType.HARD_ACCELERATION:
        return (2.5 * event.severity);
      case DrivingEventType.HARD_BRAKE:
        return (3.5 * event.severity);
      case DrivingEventType.SHARP_TURN:
        return (2 * event.severity);
      default:
        return 0;
    }
  }

  // 3. Lógica de recuperação gradual respeitando os limites dos tetos
  private recoverGradually(): void {
    const ceiling = this.getRecoveryCeiling(this.score)

    let recoveryStep = 0;

    if(this.score < 70) { recoveryStep = 0.7}
    if(this.score < 60) { recoveryStep = 0.5}
    if(this.score < 40) { recoveryStep = 0.25}

    
    if (this.score < ceiling) {
      this.score = Math.min(ceiling, this.score + this.RECOVERY_STEP);
    }
  }

    // Define qual é o teto máximo que o motorista pode recuperar baseado no score atual
    private getRecoveryCeiling(currentScore: number): number {
        if (currentScore > 75) return 100;
        if (currentScore > 60) return 75;
        return 60;
    }

  // Mantém o score estritamente entre 0 e 100
  private clampScore(): void {
    this.score = Math.max(0, Math.min(100, this.score));
  }

  private getClassification(score: number): string {
    if (score > 85) return 'Excelente';
    if (score > 70) return 'Boa';
    if (score > 60) return 'Moderada';
    if (score > 40) return 'Agressiva';
    return 'Crítica';
  }

  // Método auxiliar opcional caso precise resetar o score manualmente externamente
  public resetScore(): void {
    this.score = 100;
  }
}