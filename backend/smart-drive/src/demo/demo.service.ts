import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceStatus, TripMode, TripStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StartDemoDto } from './dto/start-demo.dto';

const DEMO_TRIP_ID = process.env.DEMO_TRIP_ID ?? 'demo-session-001';
const DEMO_DEVICE_CODE = process.env.DEMO_DEVICE_CODE ?? 'esp32-demo-001';
const DEMO_VEHICLE_ID = process.env.DEMO_VEHICLE_ID ?? 'vehicle-001';

function vehicleSnapshot(vehicle: {
  id: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  fuelType: unknown;
  tankCapacityLiters: number;
  baseUrbanConsumptionKmL: number;
  baseHighwayConsumptionKmL: number;
  baseMixedConsumptionKmL: number;
  weightKg: number | null;
  calibrationFactor: number;
}) {
  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    engine: vehicle.engine,
    fuelType: String(vehicle.fuelType),
    tankCapacityLiters: vehicle.tankCapacityLiters,
    baseUrbanConsumptionKmL: vehicle.baseUrbanConsumptionKmL,
    baseHighwayConsumptionKmL: vehicle.baseHighwayConsumptionKmL,
    baseMixedConsumptionKmL: vehicle.baseMixedConsumptionKmL,
    weightKg: vehicle.weightKg,
    calibrationFactor: vehicle.calibrationFactor,
  };
}

@Injectable()
export class DemoService {
  constructor(private readonly prisma: PrismaService) {}

  async start(dto: StartDemoDto) {
    const vehicleId = dto.vehicleId ?? DEMO_VEHICLE_ID;
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new NotFoundException('Veículo demo não encontrado. Rode a seed de demonstração.');
    }

    const device = await this.prisma.device.findFirst({
      where: { OR: [{ deviceCode: DEMO_DEVICE_CODE }, { vehicleId: vehicle.id }] },
    });
    if (!device) {
      throw new NotFoundException('Dispositivo demo não encontrado. Rode a seed de demonstração.');
    }

    const trip = await this.prisma.trip.upsert({
      where: { id: DEMO_TRIP_ID },
      create: {
        id: DEMO_TRIP_ID,
        vehicleId: vehicle.id,
        deviceId: device.id,
        driverId: vehicle.ownerId,
        mode: TripMode.DEMO,
        status: TripStatus.ACTIVE,
        vehicleSnapshot: vehicleSnapshot(vehicle),
      },
      update: {
        vehicleId: vehicle.id,
        deviceId: device.id,
        driverId: vehicle.ownerId,
        mode: TripMode.DEMO,
        status: TripStatus.ACTIVE,
        endedAt: null,
        vehicleSnapshot: vehicleSnapshot(vehicle),
      },
    });

    await this.prisma.device.update({
      where: { id: device.id },
      data: { status: DeviceStatus.ONLINE, lastSeenAt: new Date(), vehicleId: vehicle.id },
    });

    return {
      sessionId: trip.id,
      tripId: trip.id,
      scenario: dto.scenario ?? 'normal',
      startedAt: trip.startedAt.toISOString(),
    };
  }

  async reset() {
    const trip = await this.prisma.trip.findUnique({ where: { id: DEMO_TRIP_ID } });
    if (!trip) {
      return { reset: false, sessionId: DEMO_TRIP_ID };
    }

    await this.prisma.drivingEvent.deleteMany({ where: { tripId: trip.id } });
    await this.prisma.telemetryPoint.deleteMany({ where: { tripId: trip.id } });
    await this.prisma.fuelEstimate.deleteMany({ where: { tripId: trip.id } });
    await this.prisma.trip.update({
      where: { id: trip.id },
      data: {
        status: TripStatus.ACTIVE,
        endedAt: null,
        distanceKm: 0,
        durationSeconds: 0,
        averageSpeedKmh: 0,
        maxSpeedKmh: 0,
        estimatedConsumptionKmL: null,
        estimatedFuelSpentLiters: null,
        drivingScore: null,
      },
    });

    return { reset: true, sessionId: trip.id };
  }

  async current() {
    const trip = await this.prisma.trip.findUnique({
      where: { id: DEMO_TRIP_ID },
      include: { fuelEstimate: true },
    });
    if (!trip) {
      throw new NotFoundException('Sessão demo não encontrada. Inicie a demo primeiro.');
    }

    const [telemetryPointCount, eventCount] = await Promise.all([
      this.prisma.telemetryPoint.count({ where: { tripId: trip.id } }),
      this.prisma.drivingEvent.count({ where: { tripId: trip.id } }),
    ]);

    return {
      sessionId: trip.id,
      tripId: trip.id,
      telemetryPointCount,
      eventCount,
      fuelEstimate: trip.fuelEstimate ?? undefined,
    };
  }
}
