import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTelemetryStore } from '@/features/shared/realtime'
import { MobileShell } from '@/features/shell/components/MobileShell'
import { DashboardPage } from '../DashboardPage'
import { MobileLivePage } from '../MobileLivePage'

beforeEach(() => useTelemetryStore.getState().reset())

describe('Navegação dos botões do estado vazio (EPIC-12)', () => {
  it('DashboardPage: INICIAR VIAGEM e MODO DEMO navegam para demo', () => {
    const onNavigate = vi.fn()
    render(<DashboardPage onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('INICIAR VIAGEM'))
    expect(onNavigate).toHaveBeenCalledWith('demo')
    fireEvent.click(screen.getByText('MODO DEMO'))
    expect(onNavigate).toHaveBeenCalledTimes(2)
  })

  it('MobileLivePage: INICIAR VIAGEM navega para a aba de demo (menu)', () => {
    const onNavigate = vi.fn()
    render(<MobileLivePage onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText('INICIAR VIAGEM'))
    expect(onNavigate).toHaveBeenCalledWith('menu')
  })

  // Regressão UI-002 M-003: as telas precisam repassar onNav ao MobileShell, senão
  // a barra de abas inferior fica morta (onClick com onNav undefined não navega).
  it('MobileLivePage: a barra de abas inferior navega de fato', () => {
    const onNavigate = vi.fn()
    render(
      <MobileShell active="live" onNav={onNavigate}>
        <MobileLivePage onNavigate={onNavigate} />
      </MobileShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Mapa' }))
    expect(onNavigate).toHaveBeenCalledWith('map')
  })
})
