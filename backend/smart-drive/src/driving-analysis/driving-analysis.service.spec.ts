import { Test, TestingModule } from '@nestjs/testing';
import { DrivingAnalysisService } from './driving-analysis.service';

describe('DrivingAnalysisService', () => {
  let service: DrivingAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DrivingAnalysisService],
    }).compile();

    service = module.get<DrivingAnalysisService>(DrivingAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
