import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileMenuPage } from '../MobileMenuPage';

describe('MobileMenuPage', () => {
  it('abre sub-screens reais do menu', () => {
    const onOpenSub = vi.fn();
    render(<MobileMenuPage onOpenSub={onOpenSub} />);

    fireEvent.click(screen.getByRole('button', { name: /Modo Demo/i }));
    expect(onOpenSub).toHaveBeenCalledWith('demo');

    fireEvent.click(screen.getByRole('button', { name: /Meu veículo/i }));
    expect(onOpenSub).toHaveBeenCalledWith('vehicles');

    fireEvent.click(screen.getByRole('button', { name: /Dispositivos/i }));
    expect(onOpenSub).toHaveBeenCalledWith('devices');
  });
});
