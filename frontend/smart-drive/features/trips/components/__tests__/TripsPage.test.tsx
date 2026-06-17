import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TripMode, TripStatus, type Trip } from '@/features/shared/types'
import { server } from '@/mocks/server'
import { TripsPage } from '../TripsPage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <TripsPage />
    </QueryClientProvider>,
  )
}

function makeTrip(over: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-x', vehicleId: 'v1', deviceId: 'd1', driverId: 'u1', mode: TripMode.REAL,
    startedAt: '2024-03-10T08:00:00.000Z', endedAt: '2024-03-10T08:56:00.000Z',
    status: TripStatus.FINISHED, distanceKm: 12.3, durationSeconds: 1800,
    averageSpeedKmh: 30, maxSpeedKmh: 70, estimatedConsumptionKmL: 11,
    estimatedFuelSpentLiters: 2, drivingScore: 80, ...over,
  }
}

describe('TripsPage (FIX-03)', () => {
  it('sem viagem ativa: mostra o controle INICIAR VIAGEM', async () => {
    server.use(http.get('/api/trips', () => HttpResponse.json([makeTrip()])))
    renderPage()
    expect(await screen.findByText('INICIAR VIAGEM')).toBeInTheDocument()
  })

  it('com viagem ativa: mostra EM ANDAMENTO e botão ENCERRAR', async () => {
    server.use(http.get('/api/trips', () =>
      HttpResponse.json([makeTrip({ id: 'trip-active', status: TripStatus.ACTIVE, endedAt: undefined })])))
    renderPage()
    expect(await screen.findByText('VIAGEM EM ANDAMENTO')).toBeInTheDocument()
    expect(screen.getByText('ENCERRAR VIAGEM')).toBeInTheDocument()
  })

  it('erro ao carregar veículos: estado honesto de dependência externa', async () => {
    server.use(
      http.get('/api/trips', () => HttpResponse.json([])),
      http.get('/api/vehicles', () => HttpResponse.json({ error: 'x' }, { status: 500 })),
    )
    renderPage()
    expect(await screen.findByText(/DEPENDÊNCIA EXTERNA/)).toBeInTheDocument()
  })
})
