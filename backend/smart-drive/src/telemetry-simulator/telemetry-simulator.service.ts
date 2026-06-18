import { Injectable, OnModuleInit } from '@nestjs/common';
import { SmoothDrivingScenario } from './scenarios/smooth-driving.scenario';
import { DrivingEventDetectorService } from '../driving-analysis/services/driving-event-detector.service';
import { AggressiveDrivingScenario } from './scenarios/aggressive-driving.scenario';
import * as fs from 'fs';
import * as path from 'path';
import { RealisticDrivingScenario } from './scenarios/realistic.scenario';
import { TelemetryPayload } from './interfaces/telemetry.interface';
import { DrivingEvent } from 'src/driving-analysis/interfaces/driving-event.interface';
import { ImpactScenario } from './scenarios/impact.scenario';
import { GpsLossScenario } from './scenarios/gps-loss.scenario';
import { DrivingScoreService } from 'src/driving-score/driving-score.service';

@Injectable()
export class TelemetrySimulatorService implements OnModuleInit {

    private getScenarioFromEnv() {
        const scenarioType = process.env.SCENARIO?.toLowerCase();

        switch (scenarioType) {
            case 'smooth':
                return new SmoothDrivingScenario();
            case 'aggressive':
                return new AggressiveDrivingScenario();
            case 'gps':
                return new GpsLossScenario(); 
            case 'impact':
                return new ImpactScenario();
            case 'realistic':
                return new RealisticDrivingScenario(1);
            default:
                console.warn(`[Simulator] ❌ Cenário '${scenarioType}' não reconhecido.`);
                return null;
        }
    }

    onModuleInit() {

        const scenario = this.getScenarioFromEnv()
        const jsonLineNumber = null

        if (!scenario) {
            console.log('[Simulator] ❌ Nenhum cenário de telemetria foi ativado. Simulador inativo.')
            return
        }

        const drivingEventDetector = new DrivingEventDetectorService()
        const drivingScoreService = new DrivingScoreService()

        if (jsonLineNumber) {
            console.log(`[Simulator] 🔄️ Gerando ${jsonLineNumber} registros para o cenário.`)
            
            const jsonPath = path.join(process.cwd(), 'telemetria_resultados.json')
            const results: { telemetry: TelemetryPayload; events: DrivingEvent[] }[] = []

            for (let i = 0; i < jsonLineNumber; i++) {
                const telemetry = scenario.next();
                const events = drivingEventDetector.detect(telemetry)
                
                results.push({telemetry, events})
            }

            try {
                fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8')
                console.log(`\n[Simulator] ✅ Arquivo JSON salvo em: ${jsonPath}`)
            } catch (error) {
                console.error('[Simulator] ❌ Erro ao salvar o arquivo JSON:', error)
            }

            process.exit(0)
        }

        setInterval(() => {
            const telemetry = scenario.next()
            const events = drivingEventDetector.detect(telemetry)
            const score = drivingScoreService.calculate(events);

            console.log(JSON.stringify({telemetry, events, score}, null, 2))
        }, 1000)
    }
}