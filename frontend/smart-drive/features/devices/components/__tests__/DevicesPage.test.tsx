import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DeviceStatus, type Device } from '@/features/shared/types'
import { useTelemetryStore } from '@/features/shared/realtime'
import { server } from '@/mocks/server'
import { DevicesPage } from '../DevicesPage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <DevicesPage />
    </QueryClientProvider>,
  )
}

const device: Device = {
  id: 'device-001', deviceCode: 'esp32-demo-001', name: 'SmartDrive Demo 001',
  vehicleId: 'vehicle-001', firmwareVersion: 'v0.4.1',
  lastSeenAt: new Date().toISOString(), status: DeviceStatus.ONLINE,
}

describe('DevicesPage (FIX-02)', () => {
  it('mostra DISPOSITIVOS (não veículos)', async () => {
    server.use(http.get('/api/devices', () => HttpResponse.json([device])))
    renderPage()
    expect((await screen.findAllByText('esp32-demo-001')).length).toBeGreaterThan(0)
    expect(screen.getByText('DISPOSITIVOS')).toBeInTheDocument()
    // a tela NÃO deve listar veículos hardcoded (entidade errada — DEV-01/03)
    expect(screen.queryByText(/CHEVROLET/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Onix LT/i)).not.toBeInTheDocument()
  })

  it('estado honesto (pareamento indisponível) quando o backend de devices falha', async () => {
    server.use(http.get('/api/devices', () => HttpResponse.json({ error: 'x' }, { status: 500 })))
    renderPage()
    expect(await screen.findByText(/FALHA AO CARREGAR/)).toBeInTheDocument()
  })

  it('painel de telemetria ao vivo reflete o store (sem pacote → sem transmissão)', async () => {
    useTelemetryStore.getState().reset()
    server.use(http.get('/api/devices', () => HttpResponse.json([device])))
    renderPage()
    expect(await screen.findByText(/Nenhum dispositivo transmitindo/)).toBeInTheDocument()
  })

  it('cadastra um dispositivo vinculado a um veículo', async () => {
    let received: unknown
    server.use(
      http.get('/api/devices', () => HttpResponse.json([])),
      http.get('/api/vehicles', () => HttpResponse.json([
        { id: 'vehicle-001', ownerId: 'u1', brand: 'Fiat', model: 'Demo', year: 2022, engine: '1.0',
          fuelType: 'FLEX', tankCapacityLiters: 45, baseUrbanConsumptionKmL: 10,
          baseHighwayConsumptionKmL: 14, baseMixedConsumptionKmL: 12, calibrationFactor: 1, createdAt: new Date().toISOString() },
      ])),
      http.post('/api/devices', async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({
          id: 'device-new',
          lastSeenAt: new Date().toISOString(),
          status: DeviceStatus.PAIRING,
          ...(received as object),
        }, { status: 201 })
      }),
    )

    renderPage()
    fireEvent.click(await screen.findByText(/CADASTRAR DISPOSITIVO/))
    await screen.findByText(/REGISTRO/)
    await screen.findByText(/Fiat Demo/)
    fireEvent.change(screen.getByLabelText(/VEÍCULO/i), { target: { value: 'vehicle-001' } })
    fireEvent.click(screen.getByText('SALVAR'))

    await waitFor(() => expect(received).toEqual({
      name: 'ESP32 Demo',
      deviceCode: 'esp32-demo-001',
      firmwareVersion: 'v0.1.0',
      vehicleId: 'vehicle-001',
    }))
  })
})
