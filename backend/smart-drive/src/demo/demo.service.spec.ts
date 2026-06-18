import { DemoService } from './demo.service';
import { AnalysisOrchestratorService } from '../telemetry/analysis/analysis-orchestrator.service';
import { TelemetrySimulatorService } from '../telemetry-simulator/telemetry-simulator.service';
import type { TelemetryGateway } from '../telemetry/telemetry.gateway';

describe('DemoService', () => {
  let demo: DemoService;
  let emitTelemetryNew: jest.Mock;
  let emitEventDetected: jest.Mock;
  let emitScoreUpdated: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    emitTelemetryNew = jest.fn();
    emitEventDetected = jest.fn();
    emitScoreUpdated = jest.fn();
    const gateway = {
      emitTelemetryNew,
      emitEventDetected,
      emitScoreUpdated,
    } as unknown as TelemetryGateway;
    const orchestrator = new AnalysisOrchestratorService(gateway);
    demo = new DemoService(
      gateway,
      orchestrator,
      new TelemetrySimulatorService(),
    );
  });

  afterEach(() => {
    demo.reset();
    jest.useRealTimers();
  });

  it('start dirige o simulador pelo gateway e contabiliza pontos', () => {
    const session = demo.start('aggressive');
    expect(session.tripId).toBeTruthy();
    expect(session.scenario).toBe('aggressive');

    jest.advanceTimersByTime(3000); // ~3 ticks

    expect(emitTelemetryNew).toHaveBeenCalled();
    expect(emitScoreUpdated).toHaveBeenCalled();
    const current = demo.current();
    expect(current.tripId).toBe(session.tripId);
    expect(current.telemetryPointCount).toBeGreaterThanOrEqual(3);
  });

  it('reset é idempotente e limpa a sessão', () => {
    demo.start('smooth');
    jest.advanceTimersByTime(1000);

    const first = demo.reset();
    expect(first.reset).toBe(true);
    expect(first.sessionId).toBeTruthy();

    // segundo reset sem sessão não quebra
    const second = demo.reset();
    expect(second.reset).toBe(true);
    expect(second.sessionId).toBe('');

    expect(demo.current()).toEqual({
      sessionId: '',
      tripId: '',
      telemetryPointCount: 0,
      eventCount: 0,
    });
  });

  it('start substitui a sessão anterior (sessão única)', () => {
    const a = demo.start('smooth');
    const b = demo.start('aggressive');
    expect(b.tripId).not.toBe(a.tripId);
    expect(demo.current().tripId).toBe(b.tripId);
  });
});
