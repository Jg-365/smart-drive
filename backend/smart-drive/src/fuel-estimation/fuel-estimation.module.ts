import { Module } from '@nestjs/common';
import { FuelEstimationService } from './fuel-estimation.service';

@Module({
  providers: [{
      provide: 'BASE_PERFORMANCE',
      useValue: 1,
    },
    FuelEstimationService
]
})
export class FuelEstimationModule {}
