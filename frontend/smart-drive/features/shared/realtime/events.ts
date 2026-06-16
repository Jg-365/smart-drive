// Contrato de eventos WebSocket (docs/CLAUDE.json → websocket_events).
// Centralizado para evitar typos entre o hook e os testes.

export const WS_SERVER_EVENTS = {
  telemetryNew: 'telemetry:new',
  eventDetected: 'trip:eventDetected',
  scoreUpdated: 'trip:scoreUpdated',
  fuelEstimateUpdated: 'trip:fuelEstimateUpdated',
  deviceStatusChanged: 'device:statusChanged',
  tripFinished: 'trip:finished',
} as const

export const WS_CLIENT_EVENTS = {
  subscribeTrip: 'subscribe:trip',
  unsubscribeTrip: 'unsubscribe:trip',
} as const
