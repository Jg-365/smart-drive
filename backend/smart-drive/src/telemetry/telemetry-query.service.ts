import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function toEpochMs(value: Date): number {
  return value.getTime();
}

function toTelemetryPoint(point: {
  id: string;
  tripId: string;
  timestamp: Date;
  lat: number | null;
  lng: number | null;
  speedKmh: number | null;
  satellites: number | null;
  hdop: number | null;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}) {
  return {
    id: point.id,
    tripId: point.tripId,
    timestamp: toEpochMs(point.timestamp),
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
  };
}

@Injectable()
export class TelemetryQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async findLatest() {
    const point = await this.prisma.telemetryPoint.findFirst({
      orderBy: { timestamp: 'desc' },
    });
    if (!point) {
      throw new NotFoundException('Nenhum ponto de telemetria recebido ainda.');
    }
    return toTelemetryPoint(point);
  }

  async findTripTelemetry(
    tripId: string,
    page = 1,
    pageSize = 100,
  ) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(500, Math.max(1, pageSize));
    const where = { tripId };

    const [total, points] = await Promise.all([
      this.prisma.telemetryPoint.count({ where }),
      this.prisma.telemetryPoint.findMany({
        where,
        orderBy: { timestamp: 'asc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
    ]);

    return {
      data: points.map(toTelemetryPoint),
      page: safePage,
      pageSize: safePageSize,
      total,
    };
  }
}
