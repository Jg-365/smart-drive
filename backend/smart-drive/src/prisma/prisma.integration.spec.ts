import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

/**
 * Testes de integração do schema Prisma (JOA-TEC-01).
 * Requer DATABASE_URL apontando para um Postgres com as migrations aplicadas
 * (`docker compose -f backend/docker/docker-compose.yml up -d` + `npx prisma migrate dev`).
 */
describe('PrismaService (integration)', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [PrismaService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.telemetryPoint.deleteMany();
    await prisma.drivingEvent.deleteMany();
    await prisma.fuelEstimate.deleteMany();
    await prisma.refuelRecord.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.device.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();
  });

  it('cria um usuário e um veículo associado', async () => {
    const user = await prisma.user.create({
      data: { email: 'joao@smartdrive.dev', passwordHash: 'hashed' },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId: user.id,
        brand: 'Fiat',
        model: 'Uno',
        year: 2015,
        engine: '1.0',
        fuelType: 'FLEX',
        tankCapacityLiters: 48,
        baseUrbanConsumptionKmL: 9,
        baseHighwayConsumptionKmL: 12,
        baseMixedConsumptionKmL: 10,
      },
    });

    expect(vehicle.ownerId).toBe(user.id);
    expect(vehicle.calibrationFactor).toBe(1.0);
  });

  it('rejeita veículo com ownerId inexistente (FK constraint)', async () => {
    await expect(
      prisma.vehicle.create({
        data: {
          ownerId: 'nonexistent-user-id',
          brand: 'Fiat',
          model: 'Uno',
          year: 2015,
          engine: '1.0',
          fuelType: 'FLEX',
          tankCapacityLiters: 48,
          baseUrbanConsumptionKmL: 9,
          baseHighwayConsumptionKmL: 12,
          baseMixedConsumptionKmL: 10,
        },
      }),
    ).rejects.toThrow();
  });

  it('rejeita deviceCode duplicado (unique constraint)', async () => {
    await prisma.device.create({
      data: { deviceCode: 'esp32-demo-001', name: 'Carro Demo' },
    });

    await expect(
      prisma.device.create({
        data: { deviceCode: 'esp32-demo-001', name: 'Outro Device' },
      }),
    ).rejects.toThrow();
  });

  it('aceita TelemetryPoint sem GPS (lat/lng/speedKmh/satellites/hdop nulos)', async () => {
    const user = await prisma.user.create({
      data: { email: 'driver@smartdrive.dev', passwordHash: 'hashed' },
    });
    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId: user.id,
        brand: 'Fiat',
        model: 'Uno',
        year: 2015,
        engine: '1.0',
        fuelType: 'FLEX',
        tankCapacityLiters: 48,
        baseUrbanConsumptionKmL: 9,
        baseHighwayConsumptionKmL: 12,
        baseMixedConsumptionKmL: 10,
      },
    });
    const device = await prisma.device.create({
      data: {
        deviceCode: 'esp32-demo-002',
        name: 'Device sem GPS',
        vehicleId: vehicle.id,
      },
    });
    const trip = await prisma.trip.create({
      data: {
        vehicleId: vehicle.id,
        deviceId: device.id,
        driverId: user.id,
        mode: 'REAL',
        vehicleSnapshot: { tankCapacityLiters: 48 },
      },
    });

    const point = await prisma.telemetryPoint.create({
      data: {
        tripId: trip.id,
        timestamp: new Date(),
        accelX: 0.1,
        accelY: -0.2,
        accelZ: 9.8,
      },
    });

    expect(point.lat).toBeNull();
    expect(point.lng).toBeNull();
    expect(point.gyroX).toBe(0);
  });

  it('apaga TelemetryPoints e DrivingEvents em cascata ao apagar a Trip', async () => {
    const user = await prisma.user.create({
      data: { email: 'cascade@smartdrive.dev', passwordHash: 'hashed' },
    });
    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId: user.id,
        brand: 'Fiat',
        model: 'Uno',
        year: 2015,
        engine: '1.0',
        fuelType: 'FLEX',
        tankCapacityLiters: 48,
        baseUrbanConsumptionKmL: 9,
        baseHighwayConsumptionKmL: 12,
        baseMixedConsumptionKmL: 10,
      },
    });
    const device = await prisma.device.create({
      data: {
        deviceCode: 'esp32-demo-003',
        name: 'Device cascata',
        vehicleId: vehicle.id,
      },
    });
    const trip = await prisma.trip.create({
      data: {
        vehicleId: vehicle.id,
        deviceId: device.id,
        driverId: user.id,
        mode: 'REAL',
        vehicleSnapshot: { tankCapacityLiters: 48 },
      },
    });

    await prisma.telemetryPoint.create({
      data: {
        tripId: trip.id,
        timestamp: new Date(),
        accelX: 0,
        accelY: 0,
        accelZ: 9.8,
      },
    });
    await prisma.drivingEvent.create({
      data: {
        tripId: trip.id,
        type: 'HARD_BRAKE',
        severity: 'MEDIUM',
        timestamp: new Date(),
        value: 5,
        threshold: 4,
        description: 'Frenagem brusca',
      },
    });

    await prisma.trip.delete({ where: { id: trip.id } });

    expect(
      await prisma.telemetryPoint.count({ where: { tripId: trip.id } }),
    ).toBe(0);
    expect(
      await prisma.drivingEvent.count({ where: { tripId: trip.id } }),
    ).toBe(0);
  });
});
