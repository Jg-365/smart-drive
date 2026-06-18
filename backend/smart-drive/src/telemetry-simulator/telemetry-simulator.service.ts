import { Injectable } from '@nestjs/common';
import { SmoothDrivingScenario } from './scenarios/smooth-driving.scenario';
import { AggressiveDrivingScenario } from './scenarios/aggressive-driving.scenario';
import { RealisticDrivingScenario } from './scenarios/realistic.scenario';
import { ImpactScenario } from './scenarios/impact.scenario';
import { GpsLossScenario } from './scenarios/gps-loss.scenario';
import { TelemetryPayload } from './interfaces/telemetry.interface';

/** Cenário de simulação: produz um ponto de telemetria a cada chamada. */
export interface Scenario {
  next(): TelemetryPayload;
}

/**
 * Fábrica de cenários de telemetria simulada. A geração ao vivo (loop + emissão
 * via WebSocket) é orquestrada pelo DemoModule (EPIC-INT-03), que consome estes
 * cenários — este serviço não tem mais efeito colateral próprio (antes fazia
 * console.log num setInterval no boot).
 */
@Injectable()
export class TelemetrySimulatorService {
  /** Cria um cenário pelo nome, ou null se não reconhecido. */
  createScenario(name?: string): Scenario | null {
    switch (name?.toLowerCase()) {
      case 'smooth':
        return new SmoothDrivingScenario();
      case 'aggressive':
        return new AggressiveDrivingScenario();
      case 'realistic':
        return new RealisticDrivingScenario();
      case 'gps':
        return new GpsLossScenario();
      case 'impact':
        return new ImpactScenario();
      default:
        return null;
    }
  }
}
