import { BaseScenario } from './base-scenario';

export class GpsLossScenario extends BaseScenario {
  next() {
    return {
      deviceId: 'SIMULATOR-001',
      timestamp: Date.now(),
      sensors: {
        accelX: 0.1,
        accelY: 0.1,
        accelZ: 9.8,
        gyroX: 0,
        gyroY: 0,
        gyroZ: 0,
      },
      gps: {
        latitude: 0,
        longitude: 0,
        speed: 0,
        heading: 0,
      },
    };
  }
}