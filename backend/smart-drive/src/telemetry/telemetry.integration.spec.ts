import type { AddressInfo } from 'net';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import { TelemetryModule } from './telemetry.module';

const PAYLOAD = {
  deviceId: 'esp-001',
  vehicleId: 'veh-001',
  sessionId: 'sess-xyz',
  timestamp: 1_700_000_000_000,
  gps: { lat: -23.5, lng: -46.6, speedKmh: 42, satellites: 8, hdop: 1.2 },
  imu: { accelX: 0.1, accelY: 0.2, accelZ: 9.8 },
  events: { hardBrake: true },
};

const once = <T = unknown>(socket: Socket, event: string) =>
  new Promise<T>((resolve) => socket.once(event, resolve));

describe('Telemetry WebSocket (integração)', () => {
  let app: INestApplication;
  let url: string;
  let client: Socket;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TelemetryModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.listen(0); // porta aleatória
    const server = app.getHttpServer() as import('http').Server;
    const { port } = server.address() as AddressInfo;
    url = `http://localhost:${port}`;
  });

  afterAll(async () => {
    client?.disconnect();
    await app?.close();
  });

  it('cliente que assinou a viagem recebe telemetry:new após POST /telemetry', async () => {
    client = io(url, { transports: ['websocket'] });
    await once(client, 'connect');

    client.emit('subscribe:trip', 'sess-xyz');
    // dá tempo do join completar no servidor antes de disparar o POST
    await new Promise((r) => setTimeout(r, 100));

    const received = once<Record<string, unknown>>(client, 'telemetry:new');

    const res = await fetch(`${url}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PAYLOAD),
    });
    expect(res.status).toBe(202);

    const point = await received;
    expect(point).toMatchObject({
      tripId: 'sess-xyz',
      deviceId: 'esp-001',
      lat: -23.5,
      speedKmh: 42,
      accelZ: 9.8,
      hardBrake: true,
    });
  }, 20000);

  it('POST /telemetry inválido (sem deviceId) retorna 400', async () => {
    const invalid: Partial<typeof PAYLOAD> = { ...PAYLOAD };
    delete invalid.deviceId;
    const res = await fetch(`${url}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalid),
    });
    expect(res.status).toBe(400);
  });
});
