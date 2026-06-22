import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportTripJson(ownerId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, driverId: ownerId },
      include: {
        vehicle: true,
        device: true,
        telemetryPoints: { orderBy: { timestamp: 'asc' } },
        drivingEvents: { orderBy: { timestamp: 'asc' } },
        fuelEstimate: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Viagem não encontrada.');
    }

    return {
      exportedAt: new Date().toISOString(),
      format: 'smartdrive-trip-json-v1',
      trip,
      counts: {
        telemetryPoints: trip.telemetryPoints.length,
        drivingEvents: trip.drivingEvents.length,
      },
    };
  }
}
