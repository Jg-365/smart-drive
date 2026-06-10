import { NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { FuelType } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VehiclesService } from './vehicles.service';

/**
 * Testes de integração do VehiclesModule (JOA-RF-01/JOA-RF-02).
 * Requer DATABASE_URL apontando para um Postgres com as migrations aplicadas
 * (`docker compose -f backend/docker/docker-compose.yml up -d` + `npx prisma migrate dev`).
 */
describe('VehiclesService (integration)', () => {
  let prisma: PrismaService;
  let service: VehiclesService;

  const validVehicle = {
    brand: 'Fiat',
    model: 'Uno',
    year: 2015,
    engine: '1.0',
    fuelType: FuelType.FLEX,
    tankCapacityLiters: 48,
    baseUrbanConsumptionKmL: 9,
    baseHighwayConsumptionKmL: 12,
    baseMixedConsumptionKmL: 10,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [PrismaService, VehiclesService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    service = moduleRef.get(VehiclesService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();
  });

  async function createUser(email: string) {
    return prisma.user.create({ data: { email, passwordHash: 'hashed' } });
  }

  it('SPEC: deve criar veículo com todos os campos válidos pertencente ao usuário autenticado', async () => {
    const user = await createUser('owner@smartdrive.dev');

    const vehicle = await service.create(user.id, { ...validVehicle });

    expect(vehicle.ownerId).toBe(user.id);
    expect(vehicle.brand).toBe('Fiat');
    expect(vehicle.weightKg).toBeNull();
  });

  it('SPEC: peso deve ser opcional — criação sem peso deve funcionar', async () => {
    const user = await createUser('no-weight@smartdrive.dev');

    const vehicle = await service.create(user.id, { ...validVehicle });

    expect(vehicle.weightKg).toBeNull();
  });

  it('aceita peso quando informado', async () => {
    const user = await createUser('with-weight@smartdrive.dev');

    const vehicle = await service.create(user.id, {
      ...validVehicle,
      weightKg: 1100,
    });

    expect(vehicle.weightKg).toBe(1100);
  });

  it('SPEC: dois veículos podem ter mesma marca+modelo se de usuários diferentes', async () => {
    const userA = await createUser('a@smartdrive.dev');
    const userB = await createUser('b@smartdrive.dev');

    const vehicleA = await service.create(userA.id, { ...validVehicle });
    const vehicleB = await service.create(userB.id, { ...validVehicle });

    expect(vehicleA.id).not.toBe(vehicleB.id);
    expect(vehicleA.brand).toBe(vehicleB.brand);
    expect(vehicleA.model).toBe(vehicleB.model);
  });

  it('SPEC: veículo criado deve aparecer na listagem do dashboard (findAll)', async () => {
    const user = await createUser('dashboard@smartdrive.dev');
    const vehicle = await service.create(user.id, { ...validVehicle });

    const vehicles = await service.findAll(user.id);

    expect(vehicles.map((v) => v.id)).toContain(vehicle.id);
  });

  it('findAll não retorna veículos de outros usuários nem soft-deletados', async () => {
    const userA = await createUser('list-a@smartdrive.dev');
    const userB = await createUser('list-b@smartdrive.dev');

    const ownVehicle = await service.create(userA.id, { ...validVehicle });
    await service.create(userB.id, { ...validVehicle });
    const deletedVehicle = await service.create(userA.id, {
      ...validVehicle,
      model: 'Palio',
    });
    await service.remove(userA.id, deletedVehicle.id);

    const vehicles = await service.findAll(userA.id);

    expect(vehicles.map((v) => v.id)).toEqual([ownVehicle.id]);
  });

  it('SPEC: deve atualizar campos editados corretamente e manter os demais inalterados', async () => {
    const user = await createUser('update@smartdrive.dev');
    const vehicle = await service.create(user.id, { ...validVehicle });

    const updated = await service.update(user.id, vehicle.id, {
      brand: 'Volkswagen',
    });

    expect(updated.brand).toBe('Volkswagen');
    expect(updated.model).toBe(vehicle.model);
    expect(updated.year).toBe(vehicle.year);
    expect(updated.tankCapacityLiters).toBe(vehicle.tankCapacityLiters);
  });

  it('EDGE: salvar sem alterar nada não gera erro nem efeito colateral', async () => {
    const user = await createUser('no-op-update@smartdrive.dev');
    const vehicle = await service.create(user.id, { ...validVehicle });

    const updated = await service.update(user.id, vehicle.id, {});

    expect(updated).toEqual(vehicle);
  });

  it('SPEC: tentativa de editar veículo de outro usuário deve ser bloqueada', async () => {
    const owner = await createUser('victim@smartdrive.dev');
    const intruder = await createUser('intruder@smartdrive.dev');
    const vehicle = await service.create(owner.id, { ...validVehicle });

    await expect(
      service.update(intruder.id, vehicle.id, { brand: 'Hacked' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.findOne(intruder.id, vehicle.id),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.remove(intruder.id, vehicle.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft delete: veículo removido não aparece em findAll/findOne mas permanece no banco', async () => {
    const user = await createUser('soft-delete@smartdrive.dev');
    const vehicle = await service.create(user.id, { ...validVehicle });

    await service.remove(user.id, vehicle.id);

    await expect(service.findOne(user.id, vehicle.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(await service.findAll(user.id)).toEqual([]);

    const stillInDb = await prisma.vehicle.findUnique({
      where: { id: vehicle.id },
    });
    expect(stillInDb?.deletedAt).not.toBeNull();
  });

  it('rejeita criação com ownerId inexistente (FK constraint)', async () => {
    await expect(
      service.create('nonexistent-user-id', { ...validVehicle }),
    ).rejects.toThrow();
  });
});
