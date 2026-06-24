import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TripMode, TripStatus, type Trip } from '@/features/shared/types';
import { server } from '@/mocks/server';
import { MobileTripsPage } from '../MobileTripsPage';

function makeTrip(over: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-x',
    vehicleId: 'vehicle-001',
    deviceId: 'device-001',
    driverId: 'user-001',
    mode: TripMode.REAL,
    startedAt: '2026-06-23T20:00:00.000Z',
    endedAt: '2026-06-23T20:30:00.000Z',
    status: TripStatus.FINISHED,
    distanceKm: 10,
    durationSeconds: 1800,
    averageSpeedKmh: 20,
    maxSpeedKmh: 40,
    estimatedConsumptionKmL: 12,
    estimatedFuelSpentLiters: 0.8,
    drivingScore: 90,
    ...over,
  };
}

function renderPage(onNavigate = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MobileTripsPage onNavigate={onNavigate} />
    </QueryClientProvider>,
  );
  return onNavigate;
}

describe('MobileTripsPage', () => {
  it('viagem ativa navega para Ao vivo e nao chama summary', async () => {
    const onNavigate = vi.fn();
    let summaryCalled = false;
    server.use(
      http.get('/api/trips', () => HttpResponse.json([
        makeTrip({ id: 'trip-active', status: TripStatus.ACTIVE, endedAt: undefined }),
      ])),
      http.get('/api/trips/:id/summary', () => {
        summaryCalled = true;
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    renderPage(onNavigate);
    fireEvent.click(await screen.findByRole('button', { name: /trip-active/i }));

    expect(onNavigate).toHaveBeenCalledWith('live');
    expect(summaryCalled).toBe(false);
  });

  it('viagem encerrada abre relatorio', async () => {
    const trip = makeTrip({ id: 'trip-finished' });
    server.use(
      http.get('/api/trips', () => HttpResponse.json([trip])),
      http.get('/api/trips/:id/summary', () =>
        HttpResponse.json({
          trip,
          events: [],
          fuelEstimate: {
            id: 'fuel-1',
            tripId: trip.id,
            baseConsumptionKmL: 12,
            adjustedConsumptionKmL: 11,
            estimatedLitersSpent: 0.9,
            confidenceLevel: 0.8,
            modelVersion: 'v1',
          },
        }),
      ),
      http.get('/api/trips/:id/route', () => HttpResponse.json([{ lat: -3.7, lng: -38.5 }])),
    );

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /trip-finished/i }));

    await waitFor(() => expect(screen.getByText('CONDUÇÃO EXCELENTE')).toBeInTheDocument());
  });
});
