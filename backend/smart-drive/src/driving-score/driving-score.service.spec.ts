import { DrivingScoreService } from './driving-score.service';
import { ScoreClassification } from './interfaces/driving-score.interface';
import { DrivingEventType } from 'src/driving-analysis/enums/driving-event-type.enum';
import { DrivingEvent } from 'src/driving-analysis/interfaces/driving-event.interface';

function event(
  type: DrivingEventType,
  severity = 1,
): DrivingEvent {
  return { type, measuredValue: 0, threshold: 0, timestamp: 0, severity };
}

describe('DrivingScoreService', () => {
  let service: DrivingScoreService;

  beforeEach(() => {
    service = new DrivingScoreService();
  });

  it('começa em 100 / Excelente e recupera quando não há eventos', () => {
    const result = service.calculate([]);
    expect(result.value).toBe(100);
    expect(result.classification).toBe(ScoreClassification.EXCELLENT);
  });

  it('penaliza e contabiliza por tipo (contrato do front)', () => {
    const result = service.calculate([
      event(DrivingEventType.HARD_BRAKE),
      event(DrivingEventType.SHARP_TURN),
    ]);

    expect(result.value).toBeLessThan(100);
    expect(result.penalties.hardBrakes).toBe(1);
    expect(result.penalties.sharpTurns).toBe(1);
    expect(result.penalties.hardAccelerations).toBe(0);
    expect(result.penalties.speedInstability).toBe(0);
  });

  it('classifica como CRITICAL após eventos severos o suficiente', () => {
    for (let i = 0; i < 30; i++) {
      service.calculate([event(DrivingEventType.HARD_BRAKE, 3)]);
    }
    const result = service.calculate([event(DrivingEventType.HARD_BRAKE, 3)]);
    expect(result.value).toBe(0);
    expect(result.classification).toBe(ScoreClassification.CRITICAL);
  });

  it('GPS_LOST não penaliza o score', () => {
    const result = service.calculate([event(DrivingEventType.GPS_LOST)]);
    expect(result.value).toBe(100);
  });
});
