import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TelemetryGateway } from '../telemetry/telemetry.gateway';
import { AnalysisOrchestratorService } from '../telemetry/analysis/analysis-orchestrator.service';
import { toLivePointFromSim } from '../telemetry/analysis/input.mapper';
import {
  Scenario,
  TelemetrySimulatorService,
} from '../telemetry-simulator/telemetry-simulator.service';
import type { DemoProfile } from './dto/start-demo.dto';

/** Intervalo entre pontos simulados (ms). */
const TICK_MS = 1000;
const DEFAULT_VEHICLE = 'demo-vehicle';

/** Perfil enviado pelo front → cenário do simulador (Nathan). */
const SCENARIO_MAP: Record<DemoProfile, string> = {
  smooth: 'smooth',
  normal: 'realistic',
  aggressive: 'aggressive',
};

interface DemoSessionState {
  sessionId: string;
  tripId: string;
  vehicleId: string;
  scenario: DemoProfile;
  startedAt: string;
  telemetryPointCount: number;
  eventCount: number;
}

export interface DemoSessionResponse {
  sessionId: string;
  tripId: string;
  scenario: DemoProfile;
  startedAt: string;
}

export interface DemoCurrentResponse {
  sessionId: string;
  tripId: string;
  telemetryPointCount: number;
  eventCount: number;
}

/**
 * Modo demo (JOA-RF-05): inicia uma sessão que dirige o simulador do Nathan ao
 * vivo pelo pipeline real — cada tick gera um ponto, emite telemetry:new e roda
 * a análise (trip:eventDetected / trip:scoreUpdated) na sala da viagem demo.
 * Sessão única (a demo é de palco); start substitui a anterior, reset é idempotente.
 */
@Injectable()
export class DemoService implements OnModuleDestroy {
  private readonly logger = new Logger(DemoService.name);
  private session: DemoSessionState | null = null;
  private scenario: Scenario | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly gateway: TelemetryGateway,
    private readonly orchestrator: AnalysisOrchestratorService,
    private readonly simulator: TelemetrySimulatorService,
  ) {}

  start(scenario: DemoProfile, vehicleId?: string): DemoSessionResponse {
    this.stopStream(); // garante sessão única

    const id = randomUUID();
    this.scenario = this.simulator.createScenario(SCENARIO_MAP[scenario]);
    this.session = {
      sessionId: id,
      tripId: id,
      vehicleId: vehicleId ?? DEFAULT_VEHICLE,
      scenario,
      startedAt: new Date().toISOString(),
      telemetryPointCount: 0,
      eventCount: 0,
    };

    if (this.scenario) {
      this.timer = setInterval(() => this.tick(), TICK_MS);
      this.logger.debug(`Demo iniciada (${scenario}) na viagem ${id}`);
    }

    return {
      sessionId: id,
      tripId: id,
      scenario,
      startedAt: this.session.startedAt,
    };
  }

  reset(): { reset: true; sessionId: string } {
    const sessionId = this.session?.sessionId ?? '';
    if (this.session) {
      this.orchestrator.endTrip(this.session.tripId);
    }
    this.stopStream();
    this.session = null;
    return { reset: true, sessionId };
  }

  current(): DemoCurrentResponse {
    if (!this.session) {
      return { sessionId: '', tripId: '', telemetryPointCount: 0, eventCount: 0 };
    }
    return {
      sessionId: this.session.sessionId,
      tripId: this.session.tripId,
      telemetryPointCount: this.session.telemetryPointCount,
      eventCount: this.session.eventCount,
    };
  }

  /** Gera um ponto, emite telemetria e roda a análise. Público para teste. */
  tick(): void {
    if (!this.scenario || !this.session) return;
    const point = toLivePointFromSim(this.scenario.next(), {
      tripId: this.session.tripId,
      vehicleId: this.session.vehicleId,
    });
    this.gateway.emitTelemetryNew(point);
    const events = this.orchestrator.process(point.tripId, point);
    this.session.telemetryPointCount += 1;
    this.session.eventCount += events.length;
  }

  onModuleDestroy(): void {
    this.stopStream();
  }

  private stopStream(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.scenario = null;
  }
}
