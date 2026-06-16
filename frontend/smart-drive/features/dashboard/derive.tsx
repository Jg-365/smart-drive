import type React from 'react';
import { Icon } from '@/features/shared/ui/icons';
import {
  DrivingEventType,
  EventSeverity,
  ScoreClassification,
} from '@/features/shared/types';

/** Aceleração da gravidade — converte accel do contrato (m/s²) para g na UI. */
export const G = 9.80665;

/** Rótulo PT-BR da classificação do score. */
export const SCORE_HINT: Record<ScoreClassification, string> = {
  [ScoreClassification.EXCELLENT]: 'EXCELENTE',
  [ScoreClassification.GOOD]: 'CONDUÇÃO BOA',
  [ScoreClassification.MODERATE]: 'MODERADA',
  [ScoreClassification.AGGRESSIVE]: 'AGRESSIVA',
  [ScoreClassification.CRITICAL]: 'CRÍTICA',
};

type IconFn = (size?: number, color?: string) => React.ReactElement;

/** Ícone + rótulo por tipo de evento de condução. */
export const EVENT_META: Record<DrivingEventType, { icon: IconFn; label: string }> = {
  [DrivingEventType.HARD_BRAKE]: { icon: Icon.brake, label: 'Freada brusca' },
  [DrivingEventType.HARD_ACCELERATION]: { icon: Icon.bolt, label: 'Aceleração brusca' },
  [DrivingEventType.SHARP_TURN]: { icon: Icon.turn, label: 'Curva forte' },
  [DrivingEventType.IMPACT_SUSPECTED]: { icon: Icon.impact, label: 'Impacto suspeito' },
  [DrivingEventType.SPEED_SPIKE]: { icon: Icon.speed, label: 'Pico de velocidade' },
  [DrivingEventType.GPS_LOST]: { icon: Icon.sat, label: 'GPS perdido' },
  [DrivingEventType.DEVICE_DISCONNECTED]: { icon: Icon.wifi, label: 'Dispositivo desconectado' },
};

export function isHighSeverity(sev: EventSeverity): boolean {
  return sev === EventSeverity.HIGH || sev === EventSeverity.CRITICAL;
}
