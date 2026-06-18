import { AnalysisOrchestratorService } from './analysis-orchestrator.service';
import type { TelemetryGateway } from '../telemetry.gateway';
import type { LiveTelemetryPoint } from '../telemetry.mapper';
import {
  WsDrivingEventType,
  WsDrivingScore,
  WsEventSeverity,
  WsScoreClassification,
} from './ws-contracts';

function point(over: Partial<LiveTelemetryPoint> = {}): LiveTelemetryPoint {
  return {
    deviceId: 'dev-1',
    vehicleId: 'veh-1',
    tripId: 'trip-1',
    timestamp: 1_700_000_000_000,
    lat: -6.889,
    lng: -38.561,
    speedKmh: 36,
    satellites: 8,
    hdop: 1.2,
    accelX: 0,
    accelY: 0,
    accelZ: 9.8,
    gyroX: 0,
    gyroY: 0,
    gyroZ: 0,
    hardAcceleration: false,
    hardBrake: false,
    sharpTurn: false,
    impactSuspected: false,
    batteryPct: 90,
    ...over,
  };
}

describe('AnalysisOrchestratorService', () => {
  let orchestrator: AnalysisOrchestratorService;
  let emitEventDetected: jest.Mock;
  let emitScoreUpdated: jest.Mock;

  beforeEach(() => {
    emitEventDetected = jest.fn();
    emitScoreUpdated = jest.fn();
    const gateway = {
      emitEventDetected,
      emitScoreUpdated,
    } as unknown as TelemetryGateway;
    orchestrator = new AnalysisOrchestratorService(gateway);
  });

  it('cria estado sob demanda e o libera ao encerrar a viagem', () => {
    expect(orchestrator.activeTripCount()).toBe(0);

    orchestrator.process('trip-A', point({ tripId: 'trip-A' }));
    orchestrator.process('trip-B', point({ tripId: 'trip-B' }));
    expect(orchestrator.activeTripCount()).toBe(2);

    orchestrator.endTrip('trip-A');
    expect(orchestrator.activeTripCount()).toBe(1);
  });

  it('detecta freada brusca, enriquece para o contrato WS e emite', () => {
    // HardBrakeDetector: accelX < -3.8 → HARD_BRAKE
    const events = orchestrator.process('trip-A', point({ accelX: -6 }));

    const brake = events.find((e) => e.type === WsDrivingEventType.HARD_BRAKE);
    expect(brake).toBeDefined();
    expect(brake!.tripId).toBe('trip-A');
    expect(brake!.id).toBeTruthy();
    expect(brake!.timestamp).toBe(new Date(1_700_000_000_000).toISOString());
    expect(brake!.lat).toBe(-6.889);
    expect(brake!.value).toBe(-6);
    expect(brake!.threshold).toBeCloseTo(-3.8, 5);
    expect(brake!.description).toBe('Frenagem brusca');
    expect(emitEventDetected).toHaveBeenCalledWith(brake);
  });

  it('sintetiza IMPACT_SUSPECTED (CRITICAL) a partir da flag do firmware', () => {
    const events = orchestrator.process(
      'trip-A',
      point({ impactSuspected: true }),
    );

    const impact = events.find(
      (e) => e.type === WsDrivingEventType.IMPACT_SUSPECTED,
    );
    expect(impact).toBeDefined();
    expect(impact!.severity).toBe(WsEventSeverity.CRITICAL);
  });

  it('isola o estado entre viagens (detectores não compartilhados)', () => {
    const a = orchestrator.process('trip-A', point({ accelX: -6 }));
    const b = orchestrator.process('trip-B', point({ accelX: -6 }));

    expect(a.some((e) => e.type === WsDrivingEventType.HARD_BRAKE)).toBe(true);
    expect(b.some((e) => e.type === WsDrivingEventType.HARD_BRAKE)).toBe(true);
  });

  it('emite score acumulado por viagem e penaliza freadas', () => {
    orchestrator.process('trip-A', point({ accelX: -6 }));

    const last = emitScoreUpdated.mock.calls.at(-1) as [string, WsDrivingScore];
    expect(last[0]).toBe('trip-A');
    expect(last[1].value).toBeLessThan(100);
    expect(last[1].penalties.hardBrakes).toBe(1);
    expect(Object.values(WsScoreClassification)).toContain(
      last[1].classification,
    );
  });

  it('mantém o score isolado entre viagens', () => {
    // trip-A leva várias freadas; trip-B só pontos limpos.
    for (let i = 0; i < 3; i++) {
      orchestrator.process('trip-A', point({ accelX: -8 }));
    }
    orchestrator.process('trip-B', point());

    const scoreA = lastScoreFor('trip-A');
    const scoreB = lastScoreFor('trip-B');
    expect(scoreA).toBeLessThan(scoreB);
    expect(scoreB).toBe(100);
  });

  function lastScoreFor(tripId: string): number {
    const calls = emitScoreUpdated.mock.calls as [string, WsDrivingScore][];
    const forTrip = calls.filter(([id]) => id === tripId);
    return forTrip[forTrip.length - 1][1].value;
  }
});
