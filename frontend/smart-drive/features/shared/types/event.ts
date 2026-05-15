export enum DrivingEventType {
  HARD_ACCELERATION = 'HARD_ACCELERATION',
  HARD_BRAKE = 'HARD_BRAKE',
  SHARP_TURN = 'SHARP_TURN',
  IMPACT_SUSPECTED = 'IMPACT_SUSPECTED',
  SPEED_SPIKE = 'SPEED_SPIKE',
  GPS_LOST = 'GPS_LOST',
  DEVICE_DISCONNECTED = 'DEVICE_DISCONNECTED',
}

export enum EventSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface DrivingEvent {
  id: string
  tripId: string
  type: DrivingEventType
  severity: EventSeverity
  timestamp: string
  lat?: number
  lng?: number
  value: number
  threshold: number
  description: string
}
