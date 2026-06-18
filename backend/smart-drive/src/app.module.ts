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
import { DrivingAnalysisModule } from './driving-analysis/driving-analysis.module';
import { DrivingScoreModule } from './driving-score/driving-score.module';
import { FuelEstimationModule } from './fuel-estimation/fuel-estimation.module';
import { TelemetrySimulatorModule } from './telemetry-simulator/telemetry-simulator.module';

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
    // Analytics do Nathan (score/consumo/eventos) + simulador. Registrados aqui
    // para deixarem de ser código morto; a integração ao gateway é feita pelo
    // AnalysisOrchestratorService no TelemetryModule (EPIC-INT-00..03).
    DrivingAnalysisModule,
    DrivingScoreModule,
    FuelEstimationModule,
    TelemetrySimulatorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
