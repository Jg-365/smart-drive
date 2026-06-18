import { TelemetryPayload } from "src/telemetry-simulator/interfaces/telemetry.interface";
import { DrivingEvent } from "../interfaces/driving-event.interface";
import { DrivingEventType } from "../enums/driving-event-type.enum";

export class SharpTurnDetector{
    private lastPayload: TelemetryPayload | null = null;

    // Limites (Thresholds)
    private readonly GYRO_THRESHOLD = 0.5;          // rad/s
    private readonly ACCEL_LATERAL_THRESHOLD = 4.0;     // m/s²
    private readonly GPS_HEADING_RATE_THRESHOLD = 25;  // graus/s
    private readonly MIN_SPEED = 3.0;               // m/s (~11 km/h)

    private calculateSeverity(measured: number, threshold: number): number {
        return measured / threshold
    }

    public detect(current: TelemetryPayload): DrivingEvent | null {
        // 1. Ignorar se estiver muito lento ou parado
        if (current.gps.speed < this.MIN_SPEED) {
            this.lastPayload = current;
            return null;
        }

        // 2. Análise Inercial (Instantânea)
        const angularVelocity = Math.abs(current.sensors.gyroZ);
        const lateralForce = Math.abs(current.sensors.accelY);

        // Se ambos os sensores inerciais acusarem a curva
        if (angularVelocity > this.GYRO_THRESHOLD && lateralForce > this.ACCEL_LATERAL_THRESHOLD) {
            this.lastPayload = current;
            
            // Usamos o Giroscópio como o principal medidor do evento
            return {
                type: DrivingEventType.SHARP_TURN,
                measuredValue: angularVelocity, // rad/s
                method: 'GYROSCOPE',
                timestamp: current.timestamp,
                severity: this.calculateSeverity(angularVelocity, this.GYRO_THRESHOLD)
            };
        }

        // 3. Análise por GPS (Histórico/Tendência)
        if (this.lastPayload) {
            const deltaTime = (current.timestamp - this.lastPayload.timestamp) / 1000; // segundos
            
            if (deltaTime > 0 && deltaTime < 3) { // Evita gaps muito grandes de sinal
                let deltaHeading = Math.abs(current.gps.heading - this.lastPayload.gps.heading);
                
                // Ajuste para a quebra de 360° para 0°
                if (deltaHeading > 180) {
                    deltaHeading = 360 - deltaHeading;
                }

                const headingRate = deltaHeading / deltaTime; // graus por segundo
                
                if (headingRate > this.GPS_HEADING_RATE_THRESHOLD) {
                    this.lastPayload = current;
                    
                    return {
                        type: DrivingEventType.SHARP_TURN,
                        measuredValue: headingRate, // graus/s
                        method: 'GPS',
                        timestamp: current.timestamp,
                        severity: this.calculateSeverity(headingRate, this.GPS_HEADING_RATE_THRESHOLD)
                    };
                }
            }
        }

        this.lastPayload = current;
        return null; // Nenhuma curva acentuada detectada
    }
}