import { HardBrakeDetector } from "../detectors/hard-brake.detector";

describe('NAT-RF-01 - Hard Acceleration Detector', () => {
  it('Deve gerar evento HARD_ACCELERATION se passar do limiar', () => {
    const detector = new HardBrakeDetector(0.5); // Limiar de -0.5
    
    const fakeTelemetry = {
      deviceId: 'car-01',
      timestamp: Date.now(),
      sensors: {
        accelX: -0.8, // Abaixo do limiar
        accelY: 0.1,
        accelZ: 9.8,
        gyroX: 0,
        gyroY: 0,
        gyroZ: 0
      },
      gps: {
        latitude: 0,
        longitude: 0,
        heading: 180,
        speed: 1
      }
    };

    const result = detector.detect(fakeTelemetry);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('HARD_BRAKE');
  });
});