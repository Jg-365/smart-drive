// Alinhado com o contrato do frontend (features/shared/types/event.ts):
// GPS_LOST (não GPS_LOSS) e IMPACT_SUSPECTED fazem parte do mesmo enum.
export enum DrivingEventType {
  HARD_ACCELERATION = 'HARD_ACCELERATION',
  HARD_BRAKE = 'HARD_BRAKE',
  SHARP_TURN = 'SHARP_TURN',
  IMPACT_SUSPECTED = 'IMPACT_SUSPECTED',
  GPS_LOST = 'GPS_LOST'
}