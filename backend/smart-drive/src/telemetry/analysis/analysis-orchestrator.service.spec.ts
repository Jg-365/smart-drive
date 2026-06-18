import { AnalysisOrchestratorService } from './analysis-orchestrator.service';
import type { LiveTelemetryPoint } from '../telemetry.mapper';

function point(over: Partial<LiveTelemetryPoint> = {}): LiveTelemetryPoint {
  return {
    deviceId: 'dev-1',
    vehicleId: 'veh-1',
    tripId: 'trip-1',
    timestamp: Date.now(),
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

  beforeEach(() => {
    orchestrator = new AnalysisOrchestratorService();
  });

  it('cria estado sob demanda e o libera ao encerrar a viagem', () => {
    expect(orchestrator.activeTripCount()).toBe(0);

    orchestrator.process('trip-A', point({ tripId: 'trip-A' }));
    orchestrator.process('trip-B', point({ tripId: 'trip-B' }));
    expect(orchestrator.activeTripCount()).toBe(2);

    orchestrator.endTrip('trip-A');
    expect(orchestrator.activeTripCount()).toBe(1);
  });

  it('detecta freada brusca a partir de uma desaceleração forte', () => {
    // HardBrakeDetector: accelX < -3.8 (limiar padrão) → HARD_BRAKE
    const events = orchestrator.process('trip-A', point({ accelX: -6 }));

    expect(events.some((e) => e.type === 'HARD_BRAKE')).toBe(true);
  });

  it('isola o estado entre viagens (detectores não compartilhados)', () => {
    // mesma assinatura de evento em duas viagens deve render o mesmo resultado,
    // provando que cada viagem tem seu próprio detector (sem interferência).
    const a = orchestrator.process('trip-A', point({ accelX: -6 }));
    const b = orchestrator.process('trip-B', point({ accelX: -6 }));

    expect(a.some((e) => e.type === 'HARD_BRAKE')).toBe(true);
    expect(b.some((e) => e.type === 'HARD_BRAKE')).toBe(true);
  });
});
