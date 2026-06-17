import { render, screen, waitFor } from '@testing-library/react'
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

  it('estado honesto de dependência externa quando o backend de devices falha', async () => {
    server.use(http.get('/api/devices', () => HttpResponse.json({ error: 'x' }, { status: 500 })))
    renderPage()
    expect(await screen.findByText(/DEPENDÊNCIA EXTERNA/)).toBeInTheDocument()
  })

  it('painel de telemetria ao vivo reflete o store (sem pacote → sem transmissão)', async () => {
    useTelemetryStore.getState().reset()
    server.use(http.get('/api/devices', () => HttpResponse.json([device])))
    renderPage()
    expect(await screen.findByText(/Nenhum dispositivo transmitindo/)).toBeInTheDocument()
  })
})
