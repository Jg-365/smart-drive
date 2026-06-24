import { ForbiddenException } from '@nestjs/common';
import { DeviceStatus } from '../../generated/prisma/client';
import { DevicesService } from './devices.service';

const ownerId = 'demo-user-001';
const vehicleId = 'vehicle-001';

function makePrisma() {
  return {
    vehicle: { findFirst: jest.fn() },
    device: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

describe('DevicesService', () => {
  it('create cadastra dispositivo novo em estado de pareamento', async () => {
    const prisma = makePrisma();
    prisma.vehicle.findFirst.mockResolvedValue({ id: vehicleId });
    prisma.device.findUnique.mockResolvedValue(null);
    prisma.device.create.mockResolvedValue({
      id: 'device-001',
      deviceCode: 'esp32-demo-001',
      vehicleId,
      status: DeviceStatus.PAIRING,
    });

    const service = new DevicesService(prisma as never);
    await expect(
      service.create(ownerId, {
        name: 'ESP32 Demo',
        deviceCode: 'esp32-demo-001',
        firmwareVersion: 'v0.1.0',
        vehicleId,
      }),
    ).resolves.toEqual(expect.objectContaining({
      id: 'device-001',
      status: DeviceStatus.PAIRING,
    }));

    expect(prisma.device.create).toHaveBeenCalledWith({
      data: {
        name: 'ESP32 Demo',
        deviceCode: 'esp32-demo-001',
        firmwareVersion: 'v0.1.0',
        vehicleId,
        status: DeviceStatus.PAIRING,
      },
    });
  });

  it('create reaproveita deviceCode existente e relinka ao veiculo escolhido', async () => {
    const prisma = makePrisma();
    const lastSeenAt = new Date();
    prisma.vehicle.findFirst.mockResolvedValue({ id: vehicleId });
    prisma.device.findUnique.mockResolvedValue({
      id: 'device-esp32-demo-001',
      lastSeenAt,
      status: DeviceStatus.ONLINE,
    });
    prisma.device.update.mockResolvedValue({
      id: 'device-esp32-demo-001',
      deviceCode: 'esp32-demo-001',
      vehicleId,
      status: DeviceStatus.ONLINE,
    });

    const service = new DevicesService(prisma as never);
    await expect(
      service.create(ownerId, {
        name: 'ESP32 Apresentacao',
        deviceCode: 'esp32-demo-001',
        firmwareVersion: 'v0.1.0',
        vehicleId,
      }),
    ).resolves.toEqual(expect.objectContaining({
      id: 'device-esp32-demo-001',
      status: DeviceStatus.ONLINE,
    }));

    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'device-esp32-demo-001' },
      data: {
        name: 'ESP32 Apresentacao',
        firmwareVersion: 'v0.1.0',
        vehicleId,
        status: DeviceStatus.ONLINE,
      },
    });
    expect(prisma.device.create).not.toHaveBeenCalled();
  });

  it('create mantém deviceCode existente em pareamento se ele nao estiver online recente', async () => {
    const prisma = makePrisma();
    prisma.vehicle.findFirst.mockResolvedValue({ id: vehicleId });
    prisma.device.findUnique.mockResolvedValue({
      id: 'device-esp32-demo-001',
      lastSeenAt: new Date(Date.now() - 120_000),
      status: DeviceStatus.ONLINE,
    });
    prisma.device.update.mockResolvedValue({
      id: 'device-esp32-demo-001',
      status: DeviceStatus.PAIRING,
    });

    const service = new DevicesService(prisma as never);
    await service.create(ownerId, {
      name: 'ESP32 Demo',
      deviceCode: 'esp32-demo-001',
      vehicleId,
    });

    expect(prisma.device.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: DeviceStatus.PAIRING }),
    }));
  });

  it('create bloqueia vinculo com veiculo de outro usuario antes de relinkar deviceCode', async () => {
    const prisma = makePrisma();
    prisma.vehicle.findFirst.mockResolvedValue(null);

    const service = new DevicesService(prisma as never);
    await expect(
      service.create(ownerId, {
        name: 'ESP32 Demo',
        deviceCode: 'esp32-demo-001',
        vehicleId,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.device.findUnique).not.toHaveBeenCalled();
    expect(prisma.device.update).not.toHaveBeenCalled();
  });
});
