import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FuelType } from '@/features/shared/types'
import { VehicleForm } from '../VehicleForm'

function fillValid() {
  fireEvent.change(screen.getByLabelText('MARCA'), { target: { value: 'Chevrolet' } })
  fireEvent.change(screen.getByLabelText('MODELO'), { target: { value: 'Onix LT' } })
  fireEvent.change(screen.getByLabelText('ANO'), { target: { value: '2022' } })
  fireEvent.change(screen.getByLabelText('MOTOR'), { target: { value: '1.0' } })
  fireEvent.change(screen.getByLabelText('COMBUSTÍVEL'), { target: { value: FuelType.FLEX } })
  fireEvent.change(screen.getByLabelText('CONSUMO URBANO (km/L)'), { target: { value: '12.5' } })
  fireEvent.change(screen.getByLabelText('CONSUMO RODOVIÁRIO (km/L)'), { target: { value: '16' } })
  fireEvent.change(screen.getByLabelText('CONSUMO MISTO (km/L)'), { target: { value: '14' } })
  fireEvent.change(screen.getByLabelText('TANQUE (L)'), { target: { value: '42' } })
}

const noop = () => {}

describe('VehicleForm (JOA-RF-01/02)', () => {
  it('SPEC: campos inválidos exibem erro e não salvam', () => {
    const onSubmit = vi.fn()
    render(<VehicleForm title="NOVO" kicker="K" submitLabel="CADASTRAR" onSubmit={onSubmit} onCancel={noop} />)
    fireEvent.click(screen.getByText('CADASTRAR'))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Marca é obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Selecione o tipo de combustível')).toBeInTheDocument()
  })

  it('SPEC: submete dados parseados quando válido', () => {
    const onSubmit = vi.fn()
    render(<VehicleForm title="NOVO" kicker="K" submitLabel="CADASTRAR" onSubmit={onSubmit} onCancel={noop} />)
    fillValid()
    fireEvent.click(screen.getByText('CADASTRAR'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      brand: 'Chevrolet', model: 'Onix LT', year: 2022, engine: '1.0',
      fuelType: FuelType.FLEX, tankCapacityLiters: 42, baseMixedConsumptionKmL: 14,
    }))
  })

  it('modo edição pré-preenche os campos a partir de initial', () => {
    render(
      <VehicleForm
        title="EDITAR" kicker="K" submitLabel="SALVAR" onSubmit={noop} onCancel={noop}
        initial={{ brand: 'Fiat', model: 'Argo', year: '2021', engine: '1.0', fuelType: FuelType.GASOLINE,
          tankCapacityLiters: '48', baseUrbanConsumptionKmL: '11', baseHighwayConsumptionKmL: '14',
          baseMixedConsumptionKmL: '12.5', weightKg: '985' }}
      />,
    )
    expect(screen.getByLabelText('MARCA')).toHaveValue('Fiat')
    expect(screen.getByLabelText('ANO')).toHaveValue('2021')
  })

  it('CANCELAR dispara onCancel', () => {
    const onCancel = vi.fn()
    render(<VehicleForm title="NOVO" kicker="K" submitLabel="CADASTRAR" onSubmit={noop} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('CANCELAR'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('exibe erro de servidor e bloqueia clique enquanto submitting', () => {
    const onSubmit = vi.fn()
    render(
      <VehicleForm title="NOVO" kicker="K" submitLabel="CADASTRAR" submitting serverError="Dados inválidos"
        onSubmit={onSubmit} onCancel={noop} />,
    )
    expect(screen.getByText('Dados inválidos')).toBeInTheDocument()
    fillValid()
    fireEvent.click(screen.getByText('SALVANDO…'))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
