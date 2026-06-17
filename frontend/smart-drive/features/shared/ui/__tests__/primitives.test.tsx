import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Btn } from '../primitives'

describe('Btn (disabled)', () => {
  it('clique normal dispara onClick', () => {
    const onClick = vi.fn()
    render(<Btn onClick={onClick}>OK</Btn>)
    fireEvent.click(screen.getByText('OK'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled NÃO dispara onClick e marca aria-disabled', () => {
    const onClick = vi.fn()
    render(<Btn onClick={onClick} disabled>NADA</Btn>)
    const btn = screen.getByText('NADA')
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-disabled', 'true')
  })
})
