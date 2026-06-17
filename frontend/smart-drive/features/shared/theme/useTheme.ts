'use client';

import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'sd-theme';

/** Lê o tema persistido com segurança — localStorage pode lançar em modo privado. */
function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    return null;
  }
}

/** Persiste o tema com segurança; se o storage falhar, mantém só em memória. */
function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // modo privado / storage indisponível — ignora silenciosamente (fallback em memória)
  }
}

/**
 * Resolve o tema inicial: respeita o data-theme já aplicado pelo script anti-flicker,
 * depois o localStorage; padrão DARK (JOA-RF-06 — dark é o default, independente da
 * preferência do SO; só uma escolha explícita persistida muda isso).
 */
function getInitialTheme(): Theme {
  if (typeof document !== 'undefined') {
    const applied = document.documentElement.dataset.theme;
    if (applied === 'dark' || applied === 'light') return applied;
  }
  return readStoredTheme() ?? 'dark';
}

export function useTheme() {
  // Lazy init (sem setState em effect → sem cascading renders / sem flicker).
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Efeito apenas de DOM: mantém <html data-theme> em sincronia (não dispara setState).
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      writeStoredTheme(next);
      return next;
    });
  }

  return { theme, toggleTheme };
}
