import { TelemetryPayload } from '../interfaces/telemetry.interface';

export abstract class BaseScenario {
    protected lat = -6.889;
    protected lng = -38.561;
    protected heading = 90;

    protected createPayload(
        speed: number,
        accelX: number,
        accelY: number,
        accelZ = 9.8,
        gyroX = 0,
        gyroY = 0,
        gyroZ = 0,
    ): TelemetryPayload {
        this.lat += 0.00005;
        this.lng += 0.00005;

        return {
        deviceId: 'SIMULATOR-001',
        timestamp: Date.now(),
        sensors: {
            accelX,
            accelY,
            accelZ,
            gyroX,
            gyroY,
            gyroZ,
        },
        gps: {
            latitude: this.lat,
            longitude: this.lng,
            speed,
            heading: this.heading,
        },
        };
    }
}