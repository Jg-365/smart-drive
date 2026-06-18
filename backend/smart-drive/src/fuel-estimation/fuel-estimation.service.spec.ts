import { Test, TestingModule } from '@nestjs/testing';
import { FuelEstimationService } from './fuel-estimation.service';

describe('FuelEstimationService', () => {
  let service: FuelEstimationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FuelEstimationService],
    }).compile();

    service = module.get<FuelEstimationService>(FuelEstimationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
