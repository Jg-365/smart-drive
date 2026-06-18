import { DrivingEventType } from 'src/driving-analysis/enums/driving-event-type.enum';

export interface DrivingScore {
  value: number;
  classification: string;
  penalties: {
    eventType: DrivingEventType;
    pointsLost: number;
  }[];
}