import { Module } from '@nestjs/common';
import { FuelEstimationService } from './fuel-estimation.service';

@Module({
  providers: [FuelEstimationService]
})
export class FuelEstimationModule {}
