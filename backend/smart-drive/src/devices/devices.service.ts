import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DeviceStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { PairDeviceDto } from './dto/pair-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

const OFFLINE_AFTER_MS = 60_000;

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateDeviceDto) {
    await this.ensureVehicleBelongsToUser(ownerId, dto.vehicleId);

    const duplicated = await this.prisma.device.findUnique({
      where: { deviceCode: dto.deviceCode },
      select: { id: true, lastSeenAt: true, status: true },
    });

    if (duplicated) {
      const online =
        duplicated.status === DeviceStatus.ONLINE &&
        duplicated.lastSeenAt != null &&
        Date.now() - duplicated.lastSeenAt.getTime() < OFFLINE_AFTER_MS;

      return this.prisma.device.update({
        where: { id: duplicated.id },
        data: {
          name: dto.name,
          firmwareVersion: dto.firmwareVersion,
          vehicleId: dto.vehicleId,
          status: online ? DeviceStatus.ONLINE : DeviceStatus.PAIRING,
        },
      });
    }

    return this.prisma.device.create({
      data: {
        name: dto.name,
        deviceCode: dto.deviceCode,
        firmwareVersion: dto.firmwareVersion,
        vehicleId: dto.vehicleId,
        status: DeviceStatus.PAIRING,
      },
    });
  }

  async findAll(ownerId: string) {
    await this.markInactiveDevicesOffline();

    return this.prisma.device.findMany({
      where: {
        vehicle: {
          ownerId,
          deletedAt: null,
        },
      },
      include: { vehicle: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    await this.markInactiveDevicesOffline();

    const device = await this.prisma.device.findFirst({
      where: {
        id,
        vehicle: {
          ownerId,
          deletedAt: null,
        },
      },
      include: { vehicle: true },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    return device;
  }

  async pair(ownerId: string, id: string, dto: PairDeviceDto) {
    await this.findOne(ownerId, id);
    await this.ensureVehicleBelongsToUser(ownerId, dto.vehicleId);

    return this.prisma.device.update({
      where: { id },
      data: {
        vehicleId: dto.vehicleId,
        status: DeviceStatus.PAIRING,
      },
    });
  }

  async update(ownerId: string, id: string, dto: UpdateDeviceDto) {
    await this.findOne(ownerId, id);

    return this.prisma.device.update({
      where: { id },
      data: dto,
    });
  }

  async markOnlineByDeviceIdentifier(identifier: string) {
    const device = await this.findByIdentifier(identifier);

    if (!device) {
      throw new NotFoundException('Dispositivo não cadastrado.');
    }

    return this.prisma.device.update({
      where: { id: device.id },
      data: {
        lastSeenAt: new Date(),
        status: DeviceStatus.ONLINE,
      },
    });
  }

  async findByIdentifier(identifier: string) {
    return this.prisma.device.findFirst({
      where: {
        OR: [{ id: identifier }, { deviceCode: identifier }],
      },
      include: { vehicle: true },
    });
  }

  async ensureVehicleBelongsToUser(ownerId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId, deletedAt: null },
    });

    if (!vehicle) {
      throw new ForbiddenException('Veículo não pertence ao usuário autenticado.');
    }

    return vehicle;
  }

  async markInactiveDevicesOffline(reference = new Date()) {
    const threshold = new Date(reference.getTime() - OFFLINE_AFTER_MS);

    await this.prisma.device.updateMany({
      where: {
        status: DeviceStatus.ONLINE,
        lastSeenAt: { lt: threshold },
      },
      data: { status: DeviceStatus.OFFLINE },
    });
  }
}
