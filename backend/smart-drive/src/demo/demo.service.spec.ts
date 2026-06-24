import { NotFoundException } from '@nestjs/common';
import { DeviceStatus, FuelType, TripMode, TripStatus } from '../../generated/prisma/client';
import { DemoService } from './demo.service';

const vehicle = {
  id: 'vehicle-001',
  ownerId: 'demo-user-001',
  brand: 'Fiat',
  model: 'Demo',
  year: 2022,
  engine: '1.0',
  fuelType: FuelType.FLEX,
  tankCapacityLiters: 45,
  baseUrbanConsumptionKmL: 10,
  baseHighwayConsumptionKmL: 14,
  baseMixedConsumptionKmL: 12,
  weightKg: null,
  calibrationFactor: 1,
};

const device = {
  id: 'device-001',
  deviceCode: 'esp32-demo-001',
  vehicleId: 'vehicle-001',
};

function makePrisma() {
  return {
    vehicle: { findUnique: jest.fn() },
    device: { findFirst: jest.fn(), update: jest.fn() },
    trip: { upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    telemetryPoint: { count: jest.fn(), deleteMany: jest.fn() },
    drivingEvent: { count: jest.fn(), deleteMany: jest.fn() },
    fuelEstimate: { deleteMany: jest.fn() },
  };
}

describe('DemoService', () => {
  it('start cria/reativa a sessão demo padrão', async () => {
    const prisma = makePrisma();
    prisma.vehicle.findUnique.mockResolvedValue(vehicle);
    prisma.device.findFirst.mockResolvedValue(device);
    prisma.trip.upsert.mockResolvedValue({
      id: 'demo-session-001',
      startedAt: new Date('2026-06-23T21:00:00.000Z'),
    });
    prisma.device.update.mockResolvedValue(device);

    const service = new DemoService(prisma as never);
    await expect(service.start({ scenario: 'aggressive' })).resolves.toEqual({
      sessionId: 'demo-session-001',
      tripId: 'demo-session-001',
      scenario: 'aggressive',
      startedAt: '2026-06-23T21:00:00.000Z',
    });
    expect(prisma.trip.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'demo-session-001' },
      create: expect.objectContaining({
        mode: TripMode.DEMO,
        status: TripStatus.ACTIVE,
        vehicleId: 'vehicle-001',
        deviceId: 'device-001',
      }),
      update: expect.objectContaining({
        status: TripStatus.ACTIVE,
        endedAt: null,
      }),
    }));
    expect(prisma.device.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'device-001' },
      data: expect.objectContaining({ status: DeviceStatus.ONLINE }),
    }));
  });

  it('start falha de forma explícita sem seed de veículo', async () => {
    const prisma = makePrisma();
    prisma.vehicle.findUnique.mockResolvedValue(null);
    const service = new DemoService(prisma as never);
    await expect(service.start({})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('current retorna contadores da sessão demo', async () => {
    const prisma = makePrisma();
    prisma.trip.findUnique.mockResolvedValue({
      id: 'demo-session-001',
      fuelEstimate: null,
    });
    prisma.telemetryPoint.count.mockResolvedValue(12);
    prisma.drivingEvent.count.mockResolvedValue(3);

    const service = new DemoService(prisma as never);
    await expect(service.current()).resolves.toEqual({
      sessionId: 'demo-session-001',
      tripId: 'demo-session-001',
      telemetryPointCount: 12,
      eventCount: 3,
      fuelEstimate: undefined,
    });
  });
});
