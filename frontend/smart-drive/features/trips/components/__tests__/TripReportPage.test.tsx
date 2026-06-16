import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  DrivingEventType, EventSeverity, TripMode, TripStatus,
  type DrivingEvent, type FuelEstimate, type Trip,
} from '@/features/shared/types'
import { server } from '@/mocks/server'
import { TripReportPage } from '../TripReportPage'

function makeTrip(over: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1', vehicleId: 'v1', deviceId: 'd1', driverId: 'u1', mode: TripMode.REAL,
    startedAt: '2024-03-10T08:00:00.000Z', endedAt: '2024-03-10T08:56:00.000Z',
    status: TripStatus.FINISHED, distanceKm: 28.4, durationSeconds: 3374,
    averageSpeedKmh: 31, maxSpeedKmh: 78, estimatedConsumptionKmL: 11.2,
    estimatedFuelSpentLiters: 2.54, drivingScore: 75, ...over,
  }
}

const fuel: FuelEstimate = {
  id: 'f1', tripId: 'trip-1', baseConsumptionKmL: 12.5, adjustedConsumptionKmL: 11.8,
  estimatedLitersSpent: 2.54, estimatedCost: 14.96, confidenceLevel: 0.92, modelVersion: 'v1',
}

const brakeEvent: DrivingEvent = {
  id: 'e1', tripId: 'trip-1', type: DrivingEventType.HARD_BRAKE, severity: EventSeverity.HIGH,
  timestamp: '2024-03-10T08:30:00.000Z', value: -0.62, threshold: -0.5,
  description: 'Frenagem brusca detectada',
}

function setTrip(opts: {
  trip?: Trip; events?: DrivingEvent[]; fuelEstimate?: FuelEstimate;
  route?: { lat: number; lng: number }[]; summaryStatus?: number;
}) {
  const trip = opts.trip ?? makeTrip()
  server.use(
    http.get('/api/trips', () => HttpResponse.json([trip])),
    http.get('/api/trips/:id/summary', () =>
      opts.summaryStatus
        ? HttpResponse.json({ error: 'x' }, { status: opts.summaryStatus })
        : HttpResponse.json({ trip, events: opts.events ?? [], fuelEstimate: opts.fuelEstimate ?? fuel }),
    ),
    http.get('/api/trips/:id/route', () => HttpResponse.json(opts.route ?? [{ lat: -3.7, lng: -38.5 }])),
  )
}

function renderReport(tripId = 'trip-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <TripReportPage tripId={tripId} />
    </QueryClientProvider>,
  )
}

describe('TripReportPage (JOA-RF-08)', () => {
  it('SPEC: distância, duração, vel. média e máxima', async () => {
    setTrip({})
    renderReport()
    expect(await screen.findByText('00:56:14')).toBeInTheDocument() // duração hh:mm:ss
    expect(screen.getByText('28.4')).toBeInTheDocument()            // distância km
    expect(screen.getByText('31')).toBeInTheDocument()              // vel média
    expect(screen.getByText('78')).toBeInTheDocument()              // vel máxima
  })

  it('SPEC: score final com classificação textual', async () => {
    setTrip({ trip: makeTrip({ drivingScore: 75 }) })
    renderReport()
    expect(await screen.findByText('CONDUÇÃO BOA')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument()
  })

  it('SPEC: consumo em km/L com nível de confiança', async () => {
    setTrip({})
    renderReport()
    expect(await screen.findByText('11.8')).toBeInTheDocument()
    expect(screen.getByText(/Confiança do modelo: 92%/)).toBeInTheDocument()
  })

  it('SPEC: lista eventos com tipo, severidade e timestamp', async () => {
    setTrip({ events: [brakeEvent] })
    renderReport()
    expect(await screen.findByText('Frenagem brusca detectada')).toBeInTheDocument()
    expect(screen.getByText('Alta')).toBeInTheDocument()
  })

  it('SPEC + EDGE: sem eventos → mensagem positiva e recomendação positiva', async () => {
    setTrip({ events: [] })
    renderReport()
    expect(await screen.findByText(/Nenhum evento de risco registrado/)).toBeInTheDocument()
    expect(screen.getByText(/exemplar/i)).toBeInTheDocument()
  })

  it('SPEC: exibe resumo do trajeto com pontos de GPS', async () => {
    setTrip({ route: [{ lat: -3.7, lng: -38.5 }, { lat: -3.71, lng: -38.52 }] })
    renderReport()
    expect(await screen.findByText(/2 pontos de GPS/)).toBeInTheDocument()
  })

  it('EDGE: viagem sem GPS → distância "não disponível"', async () => {
    setTrip({ route: [] })
    renderReport()
    expect(await screen.findByText('não disponível')).toBeInTheDocument()
    expect(screen.getByText(/Trajeto não disponível/)).toBeInTheDocument()
  })

  it('EDGE: score 0 → Crítica; score 100 → Excelente', async () => {
    setTrip({ trip: makeTrip({ drivingScore: 0 }) })
    const { unmount } = renderReport()
    expect(await screen.findByText('CONDUÇÃO CRÍTICA')).toBeInTheDocument()
    unmount()

    setTrip({ trip: makeTrip({ drivingScore: 100 }) })
    renderReport()
    expect(await screen.findByText('CONDUÇÃO EXCELENTE')).toBeInTheDocument()
  })

  it('mostra erro quando o resumo falha', async () => {
    setTrip({ summaryStatus: 500 })
    renderReport()
    expect(await screen.findByText('Não foi possível carregar o relatório.')).toBeInTheDocument()
    expect(screen.getByText('TENTAR NOVAMENTE')).toBeInTheDocument()
  })
})
