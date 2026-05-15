'use client';

import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('sd-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('sd-theme', next);
        document.documentElement.dataset.theme = next;
      }
      return next;
    });
  }

  return { theme, toggleTheme };
}
