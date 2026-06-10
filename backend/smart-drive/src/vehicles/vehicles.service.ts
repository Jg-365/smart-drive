import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: { ...dto, ownerId },
    });
  }

  findAll(ownerId: string) {
    return this.prisma.vehicle.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
    });

    // Veículo de outro usuário é tratado como inexistente (não vaza existência).
    if (!vehicle || vehicle.ownerId !== ownerId) {
      throw new NotFoundException('Veículo não encontrado.');
    }

    return vehicle;
  }

  async update(ownerId: string, id: string, dto: UpdateVehicleDto) {
    await this.findOne(ownerId, id);

    return this.prisma.vehicle.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.findOne(ownerId, id);

    await this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
