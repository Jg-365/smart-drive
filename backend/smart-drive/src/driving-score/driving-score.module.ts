import { Module } from '@nestjs/common';
import { DrivingScoreService } from './driving-score.service';

@Module({
  providers: [DrivingScoreService]
})
export class DrivingScoreModule {}
