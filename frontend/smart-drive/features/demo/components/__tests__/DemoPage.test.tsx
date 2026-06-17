import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FuelType, type Vehicle } from '@/features/shared/types'
import { server } from '@/mocks/server'
import { useTelemetryStore } from '@/features/shared/realtime'

// O mapa MapLibre usa WebGL/canvas (indisponível no jsdom) — stub no teste.
vi.mock('@/features/map/components/LiveMapContainer', () => ({
  LiveMapContainer: () => null,
}))

import { DemoPage } from '../DemoPage'

const vehicle: Vehicle = {
  id: 'veh-1', ownerId: 'o', brand: 'Chevrolet', model: 'Onix', year: 2022, engine: '1.0',
  fuelType: FuelType.FLEX, tankCapacityLiters: 42, baseUrbanConsumptionKmL: 12,
  baseHighwayConsumptionKmL: 15, baseMixedConsumptionKmL: 13, calibrationFactor: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
}

let startCalls = 0
let resetCalls = 0
let lastStartBody: Record<string, unknown> | null = null

function setupDemoApi() {
  startCalls = 0
  resetCalls = 0
  lastStartBody = null
  server.use(
    http.get('/api/vehicles', () => HttpResponse.json([vehicle])),
    http.get('/api/demo/current', () =>
      HttpResponse.json({ sessionId: 's0', tripId: 'demo-trip-0', telemetryPointCount: 0, eventCount: 0 }),
    ),
    http.post('/api/demo/start', async ({ request }) => {
      startCalls++
      lastStartBody = (await request.json().catch(() => ({}))) as Record<string, unknown>
      return HttpResponse.json(
        { sessionId: 'sess-1', tripId: 'demo-trip-1', scenario: 'normal', startedAt: '2026-06-16T12:00:00Z' },
        { status: 201 },
      )
    }),
    http.post('/api/demo/reset', () => {
      resetCalls++
      return HttpResponse.json({ reset: true, sessionId: 's0' })
    }),
  )
}

function renderDemo(onMode = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <DemoPage mode="normal" onMode={onMode} />
    </QueryClientProvider>,
  )
}

beforeEach(() => { useTelemetryStore.getState().reset(); setupDemoApi() })
afterEach(() => vi.restoreAllMocks())

describe('DemoPage (JOA-RF-05)', () => {
  it('SPEC: iniciar demo (1 clique) cria sessão e liga o trip no store', async () => {
    renderDemo()
    fireEvent.click(await screen.findByText('INICIAR DEMO'))
    await waitFor(() => expect(startCalls).toBe(1))
    await waitFor(() => {
      const s = useTelemetryStore.getState()
      expect(s.tripId).toBe('demo-trip-1')
      expect(s.connection).toBe('live')
    })
    // passa a exibir estado ativo
    expect(await screen.findByText('DEMO ATIVA')).toBeInTheDocument()
  })

  it('EDGE: dois cliques rápidos não criam duas sessões', async () => {
    renderDemo()
    const btn = await screen.findByText('INICIAR DEMO')
    fireEvent.click(btn)
    fireEvent.click(btn)
    await waitFor(() => expect(startCalls).toBe(1))
    expect(startCalls).toBe(1)
  })

  it('SPEC: reset limpa o store e é idempotente (vários resets sem erro)', async () => {
    // simula sessão em andamento
    useTelemetryStore.getState().setTrip('demo-trip-9')
    useTelemetryStore.getState().setConnection('live')
    renderDemo()
    const resetBtn = await screen.findByText('RESET')
    fireEvent.click(resetBtn)
    fireEvent.click(resetBtn)
    await waitFor(() => expect(resetCalls).toBeGreaterThanOrEqual(1))
    await waitFor(() => {
      const s = useTelemetryStore.getState()
      expect(s.tripId).toBeNull()
      expect(s.connection).toBe('offline') // estado inicial do store após reset()
    })
  })

  it('SPEC: início rápido — veículo demo padrão quando nenhum é selecionado', async () => {
    renderDemo()
    expect(await screen.findByText('Veículo demo padrão')).toBeInTheDocument()
    fireEvent.click(screen.getByText('INICIAR DEMO'))
    await waitFor(() => expect(startCalls).toBe(1))
    // sem veículo selecionado → vehicleId ausente no payload
    expect(lastStartBody?.vehicleId).toBeUndefined()
    expect(lastStartBody?.scenario).toBe('normal')
  })

  it('seleciona veículo e envia vehicleId ao iniciar', async () => {
    renderDemo()
    fireEvent.click(await screen.findByText('Chevrolet Onix'))
    fireEvent.click(screen.getByText('INICIAR DEMO'))
    await waitFor(() => expect(startCalls).toBe(1))
    expect(lastStartBody?.vehicleId).toBe('veh-1')
  })

  it('troca de perfil dispara onMode', async () => {
    const onMode = vi.fn()
    renderDemo(onMode)
    fireEvent.click(await screen.findByLabelText('Perfil SUAVE'))
    expect(onMode).toHaveBeenCalledWith('smooth')
  })

  it('demo ativa sem GPS: aviso honesto de GPS sem fix (não interrompe)', () => {
    useTelemetryStore.getState().reset()
    useTelemetryStore.getState().setConnection('live') // demo rodando, sem lastPoint → sem fix
    renderDemo()
    expect(screen.getByText(/GPS sem fix/i)).toBeInTheDocument()
  })
})
