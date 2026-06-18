import { Test, TestingModule } from '@nestjs/testing';
import { TelemetrySimulatorService } from './telemetry-simulator.service';

describe('TelemetrySimulatorService', () => {
  let service: TelemetrySimulatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelemetrySimulatorService],
    }).compile();

    service = module.get<TelemetrySimulatorService>(TelemetrySimulatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
