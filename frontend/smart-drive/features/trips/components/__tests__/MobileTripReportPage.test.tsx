import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  DrivingEventType, EventSeverity, TripMode, TripStatus,
  type DrivingEvent, type FuelEstimate, type Trip,
} from '@/features/shared/types'
import { server } from '@/mocks/server'
import { MobileTripReportPage } from '../MobileTripReportPage'

const trip: Trip = {
  id: 'trip-9', vehicleId: 'v1', deviceId: 'd1', driverId: 'u1', mode: TripMode.REAL,
  startedAt: '2024-03-10T08:00:00.000Z', endedAt: '2024-03-10T08:56:00.000Z',
  status: TripStatus.FINISHED, distanceKm: 12.3, durationSeconds: 1800,
  averageSpeedKmh: 24, maxSpeedKmh: 60, estimatedConsumptionKmL: 11, estimatedFuelSpentLiters: 1.1,
  drivingScore: 88,
}

const fuel: FuelEstimate = {
  id: 'f', tripId: 'trip-9', baseConsumptionKmL: 12, adjustedConsumptionKmL: 11.5,
  estimatedLitersSpent: 1.1, confidenceLevel: 0.8, modelVersion: 'v1',
}

function setTrip(events: DrivingEvent[]) {
  server.use(
    http.get('/api/trips', () => HttpResponse.json([trip])),
    http.get('/api/trips/:id/summary', () => HttpResponse.json({ trip, events, fuelEstimate: fuel })),
    http.get('/api/trips/:id/route', () => HttpResponse.json([{ lat: -3.7, lng: -38.5 }])),
  )
}

function renderMobile() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MobileTripReportPage tripId="trip-9" />
    </QueryClientProvider>,
  )
}

describe('MobileTripReportPage (JOA-RF-08)', () => {
  it('exibe score com classificação e duração', async () => {
    setTrip([])
    renderMobile()
    expect(await screen.findByText('CONDUÇÃO EXCELENTE')).toBeInTheDocument()
    expect(screen.getAllByText('00:30:00').length).toBeGreaterThan(0)
  })

  it('SPEC: sem eventos → mensagem positiva', async () => {
    setTrip([])
    renderMobile()
    expect(await screen.findByText(/Nenhum evento de risco/)).toBeInTheDocument()
  })

  it('lista evento detectado', async () => {
    setTrip([{
      id: 'e', tripId: 'trip-9', type: DrivingEventType.SHARP_TURN, severity: EventSeverity.MEDIUM,
      timestamp: '2024-03-10T08:20:00.000Z', value: 0.5, threshold: 0.4, description: 'Curva forte',
    }])
    renderMobile()
    expect(await screen.findByText('Curva forte')).toBeInTheDocument()
  })
})
