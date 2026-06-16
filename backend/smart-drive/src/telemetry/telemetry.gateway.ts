import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { DeviceStatus } from '../../generated/prisma/client';
import type { LiveTelemetryPoint } from './telemetry.mapper';
import {
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENTS,
  tripRoom,
} from './telemetry.events';

export interface DeviceStatusChange {
  deviceId: string;
  vehicleId: string;
  status: DeviceStatus;
}

/**
 * Gateway WebSocket de telemetria (JOA-RF-03 infra). Clientes assinam uma
 * viagem (subscribe:trip → room trip:<id>) e recebem telemetry:new e
 * device:statusChanged daquela viagem. A ingestão real (POST /telemetry) é do
 * Pedro (PED-RF-06); aqui o gateway só roteia para as rooms.
 */
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN ?? '*' } })
export class TelemetryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(TelemetryGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`WS conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`WS desconectado: ${client.id}`);
  }

  @SubscribeMessage(WS_CLIENT_EVENTS.subscribeTrip)
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() tripId: string,
  ): void {
    if (!tripId) return;
    void client.join(tripRoom(tripId));
  }

  @SubscribeMessage(WS_CLIENT_EVENTS.unsubscribeTrip)
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() tripId: string,
  ): void {
    if (!tripId) return;
    void client.leave(tripRoom(tripId));
  }

  /** Emite um novo ponto de telemetria para quem assina a viagem. */
  emitTelemetryNew(point: LiveTelemetryPoint): void {
    this.server
      .to(tripRoom(point.tripId))
      .emit(WS_SERVER_EVENTS.telemetryNew, point);
  }

  /** Emite mudança de status da ESP32 para quem assina a viagem. */
  emitDeviceStatusChanged(tripId: string, change: DeviceStatusChange): void {
    this.server
      .to(tripRoom(tripId))
      .emit(WS_SERVER_EVENTS.deviceStatusChanged, change);
  }
}
