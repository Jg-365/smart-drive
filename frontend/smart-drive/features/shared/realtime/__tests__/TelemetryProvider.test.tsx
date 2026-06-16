import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  const socket = {
    connected: false,
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    on: vi.fn(),
    io: { on: vi.fn(), off: vi.fn() },
  }
  return { ioMock: vi.fn(() => socket) }
})
vi.mock('socket.io-client', () => ({ io: h.ioMock }))
vi.mock('@/lib/api', () => ({ fetchLiveTelemetry: vi.fn() }))

import { TelemetryProvider } from '../TelemetryProvider'

beforeEach(() => vi.clearAllMocks())

describe('TelemetryProvider', () => {
  it('renderiza os filhos e abre a conexão quando há tripId', () => {
    render(
      <TelemetryProvider tripId="trip-1">
        <span>conteúdo</span>
      </TelemetryProvider>,
    )
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
    expect(h.ioMock).toHaveBeenCalledTimes(1)
  })

  it('não abre conexão sem tripId', () => {
    render(
      <TelemetryProvider tripId={null}>
        <span>vazio</span>
      </TelemetryProvider>,
    )
    expect(screen.getByText('vazio')).toBeInTheDocument()
    expect(h.ioMock).not.toHaveBeenCalled()
  })
})
