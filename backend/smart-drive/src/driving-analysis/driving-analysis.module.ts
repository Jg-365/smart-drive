import { Module } from '@nestjs/common';
import { DrivingAnalysisService } from './driving-analysis.service';

@Module({
  providers: [DrivingAnalysisService]
})
export class DrivingAnalysisModule {}
