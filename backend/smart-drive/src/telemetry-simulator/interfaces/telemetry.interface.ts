export interface TelemetryPayload {
    deviceId: string;
    timestamp: number;
    sensors: {
        accelX: number; //positivo: pra frente, negativo: pra trás
        accelY: number; //lateral
        accelZ: number; //vertical, gravidade positiva pra baixo
        gyroX: number;
        gyroY: number;
        gyroZ: number
    };
    gps: {
        latitude: number;
        longitude: number;
        speed: number; //em km/h
        heading: number
    }
}