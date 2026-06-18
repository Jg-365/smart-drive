import { Test, TestingModule } from '@nestjs/testing';
import { DrivingScoreService } from './driving-score.service';

describe('DrivingScoreService', () => {
  let service: DrivingScoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DrivingScoreService],
    }).compile();

    service = module.get<DrivingScoreService>(DrivingScoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
