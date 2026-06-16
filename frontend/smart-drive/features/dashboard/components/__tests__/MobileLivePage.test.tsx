import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScoreClassification } from '@/features/shared/types';
import type { TelemetryPoint } from '@/features/shared/types';
import { useTelemetryStore } from '@/features/shared/realtime';
import { MobileLivePage } from '../MobileLivePage';

const G = 9.80665;
const makePoint = (over: Partial<TelemetryPoint> = {}): TelemetryPoint => ({
  id: 'p', tripId: 'trip-1', timestamp: Date.now(),
  lat: -3.7319, lng: -38.5267, speedKmh: 47,
  accelX: 0, accelY: 0, accelZ: G, ...over,
});

const startTrip = () => {
  useTelemetryStore.getState().setTrip('trip-1');
  useTelemetryStore.getState().setConnection('live');
};

beforeEach(() => useTelemetryStore.getState().reset());

describe('MobileLivePage (JOA-RF-03)', () => {
  it('sem viagem ativa exibe estado vazio com CTA', () => {
    render(<MobileLivePage />);
    expect(screen.getByText('NENHUMA VIAGEM ATIVA')).toBeInTheDocument();
    expect(screen.getByText('INICIAR VIAGEM')).toBeInTheDocument();
  });

  it('exibe velocidade, GPS e status ao vivo', () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint({ speedKmh: 47 })));
    render(<MobileLivePage />);
    expect(screen.getByText('47 km/h')).toBeInTheDocument();
    expect(screen.getByText('-3.7319 / -38.5267')).toBeInTheDocument();
    expect(screen.getByText('AO VIVO')).toBeInTheDocument();
  });

  it("exibe 'GPS indisponível' quando lat/lng null", () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint({ lat: null as never, lng: null as never })));
    render(<MobileLivePage />);
    expect(screen.getByText('GPS indisponível')).toBeInTheDocument();
  });

  it('exibe score e último evento', () => {
    startTrip();
    act(() => {
      useTelemetryStore.getState().setScore({
        value: 78, classification: ScoreClassification.GOOD,
        penalties: { hardAccelerations: 0, hardBrakes: 0, sharpTurns: 0, impactsSuspected: 0, speedInstability: 0 },
      });
      useTelemetryStore.getState().addEvent({
        id: 'e1', tripId: 'trip-1', type: 'HARD_BRAKE' as never, severity: 'HIGH' as never,
        timestamp: '2026-06-15T17:41:58Z', value: 0.62, threshold: 0.5, description: 'Freada brusca',
      });
    });
    render(<MobileLivePage />);
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('FREADA BRUSCA')).toBeInTheDocument();
  });

  it('velocidade > 300 é dado inválido', () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint({ speedKmh: 999 })));
    render(<MobileLivePage />);
    expect(screen.getByText('dado inválido')).toBeInTheDocument();
  });
});
