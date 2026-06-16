// Contrato de eventos WebSocket (docs/CLAUDE.json → websocket_events).
// Mantido em sincronia com frontend/.../features/shared/realtime/events.ts.

export const WS_SERVER_EVENTS = {
  telemetryNew: 'telemetry:new',
  eventDetected: 'trip:eventDetected',
  scoreUpdated: 'trip:scoreUpdated',
  fuelEstimateUpdated: 'trip:fuelEstimateUpdated',
  deviceStatusChanged: 'device:statusChanged',
  tripFinished: 'trip:finished',
} as const;

export const WS_CLIENT_EVENTS = {
  subscribeTrip: 'subscribe:trip',
  unsubscribeTrip: 'unsubscribe:trip',
} as const;

/** Nome da room socket.io de uma viagem. */
export const tripRoom = (tripId: string) => `trip:${tripId}`;
