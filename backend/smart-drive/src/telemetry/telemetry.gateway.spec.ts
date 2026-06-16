import type { Server, Socket } from 'socket.io';
import { DeviceStatus } from '../../generated/prisma/client';
import { WS_SERVER_EVENTS, tripRoom } from './telemetry.events';
import { TelemetryGateway } from './telemetry.gateway';
import type { LiveTelemetryPoint } from './telemetry.mapper';

describe('TelemetryGateway', () => {
  let gateway: TelemetryGateway;
  let emit: jest.Mock;
  let to: jest.Mock;

  beforeEach(() => {
    gateway = new TelemetryGateway();
    emit = jest.fn();
    to = jest.fn(() => ({ emit }));
    gateway.server = { to } as unknown as Server;
  });

  it('subscribe:trip faz o client entrar na room da viagem', () => {
    const join = jest.fn();
    gateway.handleSubscribe({ join } as unknown as Socket, 'trip-1');
    expect(join).toHaveBeenCalledWith(tripRoom('trip-1'));
  });

  it('ignora subscribe sem tripId', () => {
    const join = jest.fn();
    gateway.handleSubscribe({ join } as unknown as Socket, '');
    expect(join).not.toHaveBeenCalled();
  });

  it('unsubscribe:trip faz o client sair da room', () => {
    const leave = jest.fn();
    gateway.handleUnsubscribe({ leave } as unknown as Socket, 'trip-1');
    expect(leave).toHaveBeenCalledWith(tripRoom('trip-1'));
  });

  it('emitTelemetryNew emite telemetry:new só na room da viagem', () => {
    const point = { tripId: 'trip-1', deviceId: 'd' } as LiveTelemetryPoint;
    gateway.emitTelemetryNew(point);
    expect(to).toHaveBeenCalledWith(tripRoom('trip-1'));
    expect(emit).toHaveBeenCalledWith(WS_SERVER_EVENTS.telemetryNew, point);
  });

  it('emitDeviceStatusChanged emite device:statusChanged na room', () => {
    gateway.emitDeviceStatusChanged('trip-1', {
      deviceId: 'd',
      vehicleId: 'v',
      status: DeviceStatus.OFFLINE,
    });
    expect(to).toHaveBeenCalledWith(tripRoom('trip-1'));
    expect(emit).toHaveBeenCalledWith(
      WS_SERVER_EVENTS.deviceStatusChanged,
      expect.objectContaining({ status: DeviceStatus.OFFLINE }),
    );
  });
});
