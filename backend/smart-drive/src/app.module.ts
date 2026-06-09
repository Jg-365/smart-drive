import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DevicesModule } from './devices/devices.module';
import { TripsModule } from './trips/trips.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { DemoModule } from './demo/demo.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    VehiclesModule,
    DevicesModule,
    TripsModule,
    TelemetryModule,
    DemoModule,
    AnalysisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
