export interface TelemetryPayload {
    deviceId: string;
    timestamp: number;
    sensors: {
        accelX: number;
        accelY: number;
        accelZ: number;
        gyroX: number;
        gyroY: number;
        gyroZ: number
    };
    gps: {
        latitude: number;
        longitude: number;
        speed: number;
        heading: number
    }
}