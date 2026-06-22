import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DrivingEventType, EventSeverity, TripMode, TripStatus } from '../../generated/prisma/client';
import { DevicesService } from '../devices/devices.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisOrchestratorService } from './analysis/analysis-orchestrator.service';
import type { WsDrivingEvent } from './analysis/ws-contracts';
import { TelemetryPayloadDto } from './dto/telemetry-payload.dto';
import { TelemetryGateway } from './telemetry.gateway';
import { LiveTelemetryPoint, toLivePoint } from './telemetry.mapper';

function toTimestampDate(timestamp: number): Date {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('timestamp inválido.');
  }
  return date;
}

function hasValidGps(point: LiveTelemetryPoint): boolean {
  if (point.lat == null && point.lng == null) return false;

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

function containsInvalidGpsValues(point: LiveTelemetryPoint): boolean {
  const latProvided = point.lat != null;
  const lngProvided = point.lng != null;

  if (!latProvided && !lngProvided) return false;
  if (!latProvided || !lngProvided) return true;

  return !hasValidGps(point);
}

function sanitizeGps(point: LiveTelemetryPoint): LiveTelemetryPoint {
  if (hasValidGps(point)) return point;

  return {
    ...point,
    lat: null,
    lng: null,
    speedKmh: null,
    satellites: null,
    hdop: null,
  };
}

@Injectable()
export class TelemetryIngestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
    private readonly gateway: TelemetryGateway,
    private readonly orchestrator: AnalysisOrchestratorService,
  ) {}

  async ingest(dto: TelemetryPayloadDto) {
    const device = await this.devicesService.markOnlineByDeviceIdentifier(dto.deviceId);

    if (!device.vehicleId) {
      throw new BadRequestException('Dispositivo ainda não está pareado com veículo.');
    }

    if (device.vehicleId !== dto.vehicleId) {
      throw new BadRequestException('vehicleId não corresponde ao veículo pareado com o dispositivo.');
    }

    const trip = await this.prisma.trip.findFirst({
      where: {
        id: dto.sessionId,
        status: TripStatus.ACTIVE,
        deviceId: device.id,
        vehicleId: device.vehicleId,
      },
      include: { vehicle: { select: { baseMixedConsumptionKmL: true } } },
    });

    if (!trip) {
      throw new NotFoundException('Viagem ativa não encontrada para este dispositivo.');
    }

    const timestamp = toTimestampDate(dto.timestamp);
    const incomingPoint = toLivePoint(dto);
    const point = sanitizeGps({
      ...incomingPoint,
      deviceId: device.deviceCode,
      vehicleId: device.vehicleId,
      tripId: trip.id,
    });

    if (containsInvalidGpsValues(incomingPoint) && trip.mode === TripMode.REAL) {
      throw new BadRequestException('GPS inválido para viagem em modo REAL.');
    }

    const telemetryPoint = await this.prisma.telemetryPoint.create({
      data: {
        tripId: trip.id,
        timestamp,
        lat: point.lat,
        lng: point.lng,
        speedKmh: point.speedKmh,
        satellites: point.satellites,
        hdop: point.hdop,
        accelX: point.accelX,
        accelY: point.accelY,
        accelZ: point.accelZ,
        gyroX: point.gyroX,
        gyroY: point.gyroY,
        gyroZ: point.gyroZ,
      },
    });

    this.gateway.emitTelemetryNew(point);
    const events = this.orchestrator.process(
      point.tripId,
      point,
      trip.vehicle.baseMixedConsumptionKmL,
    );
    await this.persistEvents(events);

    return {
      ok: true,
      tripId: trip.id,
      telemetryPointId: telemetryPoint.id,
      eventsCount: events.length,
    };
  }

  private async persistEvents(events: WsDrivingEvent[]) {
    if (events.length === 0) return;

    await this.prisma.drivingEvent.createMany({
      data: events.map((event) => ({
        id: event.id,
        tripId: event.tripId,
        type: event.type as unknown as DrivingEventType,
        severity: event.severity as unknown as EventSeverity,
        timestamp: new Date(event.timestamp),
        lat: event.lat,
        lng: event.lng,
        value: event.value,
        threshold: event.threshold,
        description: event.description,
      })),
      skipDuplicates: true,
    });
  }
}
