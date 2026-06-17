import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTelemetryStore } from '@/features/shared/realtime'
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
})
