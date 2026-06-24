import { NotFoundException } from '@nestjs/common';
import { TelemetryQueryService } from './telemetry-query.service';

const point = {
  id: 'tp-001',
  tripId: 'trip-001',
  timestamp: new Date('2026-06-23T21:00:00.000Z'),
  lat: -3.7319,
  lng: -38.5267,
  speedKmh: 42,
  satellites: 8,
  hdop: 1.2,
  accelX: 0.1,
  accelY: 0.2,
  accelZ: 9.8,
  gyroX: 0,
  gyroY: 0,
  gyroZ: 0,
};

function makePrisma() {
  return {
    telemetryPoint: {
      findFirst: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

describe('TelemetryQueryService', () => {
  it('findLatest retorna o último ponto no shape do frontend', async () => {
    const prisma = makePrisma();
    prisma.telemetryPoint.findFirst.mockResolvedValue(point);
    const service = new TelemetryQueryService(prisma as never);

    await expect(service.findLatest()).resolves.toMatchObject({
      id: 'tp-001',
      tripId: 'trip-001',
      timestamp: Date.parse('2026-06-23T21:00:00.000Z'),
      lat: -3.7319,
      speedKmh: 42,
      accelZ: 9.8,
    });
  });

  it('findLatest falha de forma explícita sem telemetria', async () => {
    const prisma = makePrisma();
    prisma.telemetryPoint.findFirst.mockResolvedValue(null);
    const service = new TelemetryQueryService(prisma as never);

    await expect(service.findLatest()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findTripTelemetry pagina e limita pageSize', async () => {
    const prisma = makePrisma();
    prisma.telemetryPoint.count.mockResolvedValue(1);
    prisma.telemetryPoint.findMany.mockResolvedValue([point]);
    const service = new TelemetryQueryService(prisma as never);

    await expect(service.findTripTelemetry('trip-001', 2, 999)).resolves.toEqual({
      data: [expect.objectContaining({ id: 'tp-001', tripId: 'trip-001' })],
      page: 2,
      pageSize: 500,
      total: 1,
    });
    expect(prisma.telemetryPoint.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tripId: 'trip-001' },
      skip: 500,
      take: 500,
    }));
  });
});
