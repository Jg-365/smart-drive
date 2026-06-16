import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DrivingEventType,
  EventSeverity,
  ScoreClassification,
} from '@/features/shared/types';
import type { DrivingEvent, FuelEstimate, TelemetryPoint } from '@/features/shared/types';
import { useTelemetryStore } from '@/features/shared/realtime';
import { DashboardPage } from '../DashboardPage';

const G = 9.80665;

const makePoint = (over: Partial<TelemetryPoint> = {}): TelemetryPoint => ({
  id: 'p', tripId: 'trip-1', timestamp: Date.now(),
  lat: -3.731, lng: -38.526, speedKmh: 47,
  accelX: 0.1 * G, accelY: -0.2 * G, accelZ: G,
  ...over,
});

const fuel: FuelEstimate = {
  id: 'fe', tripId: 'trip-1', baseConsumptionKmL: 12, adjustedConsumptionKmL: 10.8,
  estimatedLitersSpent: 1.36, estimatedCost: 8.03, confidenceLevel: 0.72, modelVersion: 'v1',
};

const event = (over: Partial<DrivingEvent> = {}): DrivingEvent => ({
  id: 'ev-' + Math.random(), tripId: 'trip-1', type: DrivingEventType.HARD_BRAKE,
  severity: EventSeverity.HIGH, timestamp: '2026-06-15T17:41:58Z',
  value: 0.62, threshold: 0.5, description: 'Freada brusca', ...over,
});

const startTrip = () => {
  const s = useTelemetryStore.getState();
  s.setTrip('trip-1');
  s.setConnection('live');
};

beforeEach(() => useTelemetryStore.getState().reset());
afterEach(() => vi.useRealTimers());

describe('DashboardPage (JOA-RF-03)', () => {
  it('SPEC: sem viagem ativa exibe estado vazio com call-to-action', () => {
    render(<DashboardPage />);
    expect(screen.getByText('NENHUMA VIAGEM ATIVA')).toBeInTheDocument();
    expect(screen.getByText('INICIAR VIAGEM')).toBeInTheDocument();
  });

  it('SPEC: exibe velocidade atual do último ponto', () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint({ speedKmh: 47 })));
    render(<DashboardPage />);
    expect(screen.getAllByText('47 km/h').length).toBeGreaterThan(0);
  });

  it('SPEC: exibe aceleração atual', () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint()));
    render(<DashboardPage />);
    // |a| de (0.1, -0.2, 1.0) g ≈ 1.02 g
    expect(screen.getByText(/\|a\| 1\.02 g/)).toBeInTheDocument();
  });

  it('SPEC: exibe localização quando GPS disponível', () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint({ lat: -3.73192, lng: -38.52674 })));
    render(<DashboardPage />);
    expect(screen.getByText('-3.73192')).toBeInTheDocument();
    expect(screen.getByText('-38.52674')).toBeInTheDocument();
  });

  it("SPEC: exibe 'GPS indisponível' quando lat/lng são null", () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint({ lat: null as never, lng: null as never })));
    render(<DashboardPage />);
    expect(screen.getByText('GPS indisponível')).toBeInTheDocument();
  });

  it('SPEC: exibe status online quando recebe telemetria', () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint()));
    render(<DashboardPage />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('SPEC: vai a offline após N segundos sem pacote', () => {
    vi.useFakeTimers();
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint()));
    render(<DashboardPage />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
  });

  it('SPEC: exibe eventos detectados em lista recente', () => {
    startTrip();
    act(() => useTelemetryStore.getState().addEvent(event({ description: 'Freada brusca na BR-116' })));
    render(<DashboardPage />);
    expect(screen.getByText('Freada brusca na BR-116')).toBeInTheDocument();
  });

  it('SPEC: exibe score parcial da viagem corrente', () => {
    startTrip();
    act(() => useTelemetryStore.getState().setScore({
      value: 78, classification: ScoreClassification.GOOD,
      penalties: { hardAccelerations: 1, hardBrakes: 6, sharpTurns: 9, impactsSuspected: 0, speedInstability: 7 },
    }));
    render(<DashboardPage />);
    expect(screen.getByText('CONDUÇÃO BOA')).toBeInTheDocument();
    expect(screen.getByText('6 FREADAS')).toBeInTheDocument();
  });

  it('SPEC: exibe consumo estimado parcial', () => {
    startTrip();
    act(() => useTelemetryStore.getState().setFuelEstimate(fuel));
    render(<DashboardPage />);
    expect(screen.getByText('10.8')).toBeInTheDocument();
    expect(screen.getByText('CONF. 72%')).toBeInTheDocument();
  });

  it('SPEC: atualiza sem refresh de página', () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint({ speedKmh: 30 })));
    render(<DashboardPage />);
    expect(screen.getAllByText('30 km/h').length).toBeGreaterThan(0);
    act(() => useTelemetryStore.getState().ingestPoint(makePoint({ speedKmh: 80 })));
    expect(screen.getAllByText('80 km/h').length).toBeGreaterThan(0);
  });

  it('SPEC: indica visualmente quando dispositivo desconectar (reconnecting)', () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint()));
    render(<DashboardPage />);
    act(() => useTelemetryStore.getState().setConnection('reconnecting'));
    expect(screen.getByText('RECONECTANDO')).toBeInTheDocument();
    expect(screen.getByText(/CONEXÃO PERDIDA/)).toBeInTheDocument();
  });

  it('EDGE: velocidade > 300 km/h é tratada como dado inválido', () => {
    startTrip();
    act(() => useTelemetryStore.getState().ingestPoint(makePoint({ speedKmh: 999 })));
    render(<DashboardPage />);
    expect(screen.getByText('dado inválido')).toBeInTheDocument();
    expect(screen.queryByText('999 km/h')).not.toBeInTheDocument();
  });

  it('EDGE: múltiplos eventos simultâneos — lista renderiza o burst', () => {
    startTrip();
    act(() => {
      const s = useTelemetryStore.getState();
      for (let i = 0; i < 8; i++) s.addEvent(event({ id: 'e' + i, description: `Evento ${i}` }));
    });
    render(<DashboardPage />);
    // mostra no máximo 6 no feed, sem quebrar
    expect(screen.getByText('Evento 7')).toBeInTheDocument();
  });
});
