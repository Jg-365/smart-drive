import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Dynamic imports so we can test after module creation
// Tests will import after setup

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets data-theme="dark" on documentElement by default', async () => {
    const { ThemeProvider } = await import('../ThemeProvider');
    render(<ThemeProvider><div>child</div></ThemeProvider>);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggleTheme changes data-theme from dark to light', async () => {
    const { ThemeProvider, useThemeContext } = await import('../ThemeProvider');

    function Toggler() {
      const { toggleTheme, theme } = useThemeContext();
      return <button onClick={toggleTheme} data-testid="toggle">{theme}</button>;
    }

    render(<ThemeProvider><Toggler /></ThemeProvider>);

    const btn = screen.getByTestId('toggle');
    expect(btn.textContent).toBe('dark');

    await act(async () => {
      await userEvent.click(btn);
    });

    expect(btn.textContent).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('toggleTheme changes data-theme back to dark from light', async () => {
    const { ThemeProvider, useThemeContext } = await import('../ThemeProvider');

    function Toggler() {
      const { toggleTheme, theme } = useThemeContext();
      return <button onClick={toggleTheme} data-testid="toggle">{theme}</button>;
    }

    render(<ThemeProvider><Toggler /></ThemeProvider>);

    const btn = screen.getByTestId('toggle');

    await act(async () => { await userEvent.click(btn); });
    expect(btn.textContent).toBe('light');

    await act(async () => { await userEvent.click(btn); });
    expect(btn.textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('persists theme to localStorage key sd-theme', async () => {
    const { ThemeProvider, useThemeContext } = await import('../ThemeProvider');

    function Toggler() {
      const { toggleTheme } = useThemeContext();
      return <button onClick={toggleTheme} data-testid="toggle">toggle</button>;
    }

    render(<ThemeProvider><Toggler /></ThemeProvider>);

    await act(async () => {
      await userEvent.click(screen.getByTestId('toggle'));
    });

    expect(localStorage.getItem('sd-theme')).toBe('light');
  });

  it('reads persisted theme from localStorage on mount', async () => {
    localStorage.setItem('sd-theme', 'light');

    const { ThemeProvider, useThemeContext } = await import('../ThemeProvider');

    function Display() {
      const { theme } = useThemeContext();
      return <span data-testid="theme">{theme}</span>;
    }

    render(<ThemeProvider><Display /></ThemeProvider>);
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders a button', async () => {
    const { ThemeProvider } = await import('../ThemeProvider');
    const { ThemeToggle } = await import('../ThemeToggle');

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('clicking ThemeToggle calls toggleTheme', async () => {
    const { ThemeProvider, useThemeContext } = await import('../ThemeProvider');
    const { ThemeToggle } = await import('../ThemeToggle');

    function ThemeDisplay() {
      const { theme } = useThemeContext();
      return <span data-testid="theme-display">{theme}</span>;
    }

    render(
      <ThemeProvider>
        <ThemeDisplay />
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-display').textContent).toBe('dark');

    await act(async () => {
      await userEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByTestId('theme-display').textContent).toBe('light');
  });
});
