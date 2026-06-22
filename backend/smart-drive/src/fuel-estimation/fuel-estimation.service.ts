import { Injectable, Inject } from '@nestjs/common';
import { TelemetryPayload } from 'src/telemetry-simulator/interfaces/telemetry.interface';

@Injectable()
export class FuelEstimationService {
    private basePerformance: number;

    // Limites e coeficientes empíricos (podem ser movidos para variáveis de ambiente)
    private readonly MAX_ACCEL_ECO = 1.5 // m/s² confortável
    private readonly MAX_ACCEL_ALERT = 3.0 // m/s² agressivo (freada ou arrancada brusca)
    private readonly SPEED_ECO_MIN = 60 // km/h
    private readonly SPEED_ECO_MAX = 90 // km/h

    constructor(@Inject('BASE_PERFORMANCE') basePerformance: number) {
        this.basePerformance = basePerformance; // performance base em km/l, padrão = 1 -> retorna o fator multiplicador
    }

    /**
     * Calcula o rendimento estimado (km/l) baseado em um lote de telemetria.
     */
    calculate(telemetry: TelemetryPayload[]): number {
        if (!telemetry || telemetry.length === 0) {
            return this.basePerformance;
        }

        let totalScore = 0;

        for (const point of telemetry) {
            let pointScore = 1.0; // Multiplicador base para este ponto específico

            // Análise de Aceleração Longitudinal (Eixo X - frente/trás)
            const accelLong = Math.abs(point.sensors.accelX);
            
            if (accelLong > this.MAX_ACCEL_ALERT) {
                pointScore -= 0.25; // Penalidade pesada para arrancada/frenagem brusca
            } else if (accelLong > this.MAX_ACCEL_ECO) {
                pointScore -= 0.10; // Penalidade leve
            } else {
                pointScore += 0.05; // Bônus por direção suave
            }

            // Análise de Curvas (Aceleração Lateral Y + Giroscópio Z)
            const accelLat = Math.abs(point.sensors.accelY);
            const gyroYaw = Math.abs(point.sensors.gyroZ);

            if (accelLat > 2.0 || gyroYaw > 0.5) { 
                pointScore -= 0.15; // Curva fechada ou em alta velocidade
            }

            // Análise de Velocidade de Cruzeiro
            const speed = point.gps.speed // km/h

            if (speed > this.SPEED_ECO_MIN && speed < this.SPEED_ECO_MAX) {
                pointScore += 0.10; // Zona de eficiência ideal (Cruzeiro)
            } else if (speed > 110) {
                pointScore -= 0.15; // Velocidade muito alta (Arrasto aerodinâmico)
            } else if (speed < 15 && speed > 0) {
                pointScore -= 0.20; // Trânsito pesado / Marcha baixa
            }

            // Garantir limites saudáveis para o multiplicador de um único ponto
            pointScore = Math.max(0.5, Math.min(1.4, pointScore));
            totalScore += pointScore;
        }

        // Média de pontuação do lote analisado
        const finalMultiplier = totalScore / telemetry.length;

        // Retorna o km/l final estimado para este lote
        return Number((this.basePerformance * finalMultiplier).toFixed(2));
    }
}