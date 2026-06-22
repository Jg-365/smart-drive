import { Test, TestingModule } from '@nestjs/testing';
import { FuelEstimationService } from './fuel-estimation.service';

describe('FuelEstimationService', () => {
  let service: FuelEstimationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: 'BASE_PERFORMANCE', useValue: 1 },
        FuelEstimationService,
      ],
    }).compile();

    service = module.get<FuelEstimationService>(FuelEstimationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
