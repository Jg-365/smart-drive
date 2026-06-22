import { Injectable, Inject } from '@nestjs/common';
import { TelemetryPayload } from 'src/telemetry-simulator/interfaces/telemetry.interface';

@Injectable()
export class FuelEstimationService {
    private basePerformance: number;

    // Limites e coeficientes empíricos (podem ser movidos para variáveis de ambiente)
    private readonly MAX_ACCEL_ECO = 1.5;     // m/s² confortável
    private readonly MAX_ACCEL_ALERT = 3.0;   // m/s² agressivo (freada ou arrancada brusca)
    private readonly SPEED_ECO_MIN = 60 / 3.6; // 60 km/h em m/s
    private readonly SPEED_ECO_MAX = 90 / 3.6; // 90 km/h em m/s

    constructor(@Inject('BASE_PERFORMANCE') basePerformance: number) {
        this.basePerformance = basePerformance;
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

        // 1. Análise de Aceleração Longitudinal (Eixo Y - Geralmente frente/trás)
        // Usamos Math.abs porque tanto aceleração quanto frenagem excessiva gastam combustível
        const accelLong = Math.abs(point.sensors.accelY);
        
        if (accelLong > this.MAX_ACCEL_ALERT) {
            pointScore -= 0.25; // Penalidade pesada para arrancada/frenagem brusca
        } else if (accelLong > this.MAX_ACCEL_ECO) {
            pointScore -= 0.10; // Penalidade leve
        } else {
            pointScore += 0.05; // Bônus por direção suave
        }

        // 2. Análise de Curvas (Aceleração Lateral X + Giroscópio Z)
        const accelLat = Math.abs(point.sensors.accelX);
        const gyroYaw = Math.abs(point.sensors.gyroZ);

        if (accelLat > 2.0 || gyroYaw > 0.5) { 
            pointScore -= 0.15; // Curva fechada ou em alta velocidade
        }

        // 3. Análise de Velocidade de Cruzeiro (GPS speed vem em m/s ou km/h dependendo do simulador)
        // Assumindo que o GPS traga em m/s (padrão de geolocalização). Se for km/h, remova as divisões por 3.6 acima.
        const speed = point.gps.speed;

        if ((speed/3.6) > this.SPEED_ECO_MIN && speed < this.SPEED_ECO_MAX) {
            pointScore += 0.10; // Zona de eficiência ideal (Cruzeiro)
        } else if (speed > 110 / 3.6) {
            pointScore -= 0.15; // Velocidade muito alta (Arrasto aerodinâmico)
        } else if (speed < 15 / 3.6 && speed > 0) {
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