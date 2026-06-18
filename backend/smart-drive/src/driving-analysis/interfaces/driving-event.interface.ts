import { DrivingEventType } from "../enums/driving-event-type.enum";

export interface DrivingEvent {
  type: DrivingEventType;
  measuredValue: number;
  /** Limiar que disparou o evento (para o front exibir valor vs. limiar). */
  threshold: number;
  method?: string;
  timestamp: number;
  severity: number;
}