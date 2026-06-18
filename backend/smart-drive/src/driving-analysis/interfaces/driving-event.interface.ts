import { DrivingEventType } from "../enums/driving-event-type.enum";

export interface DrivingEvent {
  type: DrivingEventType;
  measuredValue: number;
  method?: string;
  timestamp: number;
  severity: number;
}