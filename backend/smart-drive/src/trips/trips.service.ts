import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeviceStatus, TripMode, TripStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import { EndTripDto } from './dto/end-trip.dto';
import { StartTripDto } from './dto/start-trip.dto';

interface VehicleSnapshotSource {
  id: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  fuelType: string;
  tankCapacityLiters: number;
  baseUrbanConsumptionKmL: number;
  baseHighwayConsumptionKmL: number;
  baseMixedConsumptionKmL: number;
  weightKg: number | null;
  calibrationFactor: number;
}

interface GpsPoint {
  lat: number | null;
  lng: number | null;
  timestamp: Date;
}

function hasValidGps(point: GpsPoint): point is GpsPoint & { lat: number; lng: number } {
  return (
    typeof point.lat === 'number' &&
    typeof point.lng === 'number' &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

function distanceKmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function toVehicleSnapshot(vehicle: VehicleSnapshotSource) {
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

function calculateDistance(points: GpsPoint[]): number {
  const validPoints = points.filter(hasValidGps);
  let distanceKm = 0;

  for (let i = 1; i < validPoints.length; i += 1) {
    distanceKm += distanceKmBetween(validPoints[i - 1], validPoints[i]);
  }

  return Number(distanceKm.toFixed(3));
}

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
  ) {}

  async start(ownerId: string, dto: StartTripDto) {
    const vehicle = await this.ensureVehicleBelongsToUser(ownerId, dto.vehicleId);
    const device = await this.devicesService.findByIdentifier(dto.deviceId);

    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    if (device.vehicleId !== vehicle.id) {
      throw new BadRequestException('Dispositivo não está pareado com este veículo.');
    }

    const conflictingTrip = await this.prisma.trip.findFirst({
      where: {
        status: TripStatus.ACTIVE,
        OR: [{ vehicleId: vehicle.id }, { deviceId: device.id }],
      },
      select: { id: true },
    });

    if (conflictingTrip) {
      throw new ConflictException('Já existe uma viagem ativa para este veículo ou dispositivo.');
    }

    const trip = await this.prisma.trip.create({
      data: {
        vehicleId: vehicle.id,
        deviceId: device.id,
        driverId: ownerId,
        mode: dto.mode ?? TripMode.REAL,
        status: TripStatus.ACTIVE,
        vehicleSnapshot: toVehicleSnapshot(vehicle),
      },
    });

    await this.prisma.device.update({
      where: { id: device.id },
      data: { status: DeviceStatus.ONLINE, lastSeenAt: new Date() },
    });

    return trip;
  }

  async end(ownerId: string, tripId: string, dto: EndTripDto) {
    const trip = await this.findOwnedTrip(ownerId, tripId);

    if (trip.status !== TripStatus.ACTIVE) {
      throw new BadRequestException('Viagem não está ativa.');
    }

    const endedAt = new Date();
    const telemetry = await this.prisma.telemetryPoint.findMany({
      where: { tripId },
      orderBy: { timestamp: 'asc' },
    });
    const eventsCount = await this.prisma.drivingEvent.count({
      where: { tripId },
    });

    const calculatedDistanceKm = calculateDistance(telemetry);
    const durationSeconds = Math.max(
      0,
      Math.round((endedAt.getTime() - trip.startedAt.getTime()) / 1000),
    );
    const distanceKm = dto.distanceKm ?? calculatedDistanceKm;
    const averageSpeedKmh =
      dto.averageSpeedKmh ??
      (durationSeconds > 0 ? Number(((distanceKm / durationSeconds) * 3600).toFixed(2)) : 0);
    const maxSpeedKmh =
      dto.maxSpeedKmh ??
      Math.max(0, ...telemetry.map((p) => p.speedKmh ?? 0));

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        endedAt,
        status: TripStatus.FINISHED,
        distanceKm,
        durationSeconds,
        averageSpeedKmh,
        maxSpeedKmh,
        estimatedConsumptionKmL: dto.estimatedConsumptionKmL,
        estimatedFuelSpentLiters: dto.estimatedFuelSpentLiters,
        drivingScore: dto.drivingScore,
      },
      include: {
        vehicle: true,
        device: true,
      },
    });

    return {
      ...updated,
      summary: {
        distanceKm,
        durationSeconds,
        averageSpeedKmh,
        maxSpeedKmh,
        eventsCount,
        drivingScore: updated.drivingScore,
        estimatedConsumptionKmL: updated.estimatedConsumptionKmL,
        estimatedFuelSpentLiters: updated.estimatedFuelSpentLiters,
      },
    };
  }

  async findAll(ownerId: string) {
    return this.prisma.trip.findMany({
      where: { driverId: ownerId },
      include: { vehicle: true, device: true },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findOne(ownerId: string, tripId: string) {
    return this.findOwnedTrip(ownerId, tripId, true);
  }

  async findTelemetryPoints(ownerId: string, tripId: string) {
    await this.findOwnedTrip(ownerId, tripId);

    return this.prisma.telemetryPoint.findMany({
      where: {
        tripId,
        lat: { not: null },
        lng: { not: null },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findEvents(ownerId: string, tripId: string) {
    await this.findOwnedTrip(ownerId, tripId);

    return this.prisma.drivingEvent.findMany({
      where: { tripId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findOwnedTrip(ownerId: string, tripId: string, includeRelations = false) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, driverId: ownerId },
      include: includeRelations
        ? { vehicle: true, device: true, telemetryPoints: true, drivingEvents: true }
        : undefined,
    });

    if (!trip) {
      throw new NotFoundException('Viagem não encontrada.');
    }

    return trip;
  }

  private async ensureVehicleBelongsToUser(ownerId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId, deletedAt: null },
    });

    if (!vehicle) {
      throw new ForbiddenException('Veículo não pertence ao usuário autenticado.');
    }

    return vehicle;
  }
}
