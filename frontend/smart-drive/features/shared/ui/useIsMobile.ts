'use client';

import { useEffect, useState } from 'react';

/** Largura máxima tratada como "mobile" (escolhe a árvore mobile do app). */
export const MOBILE_MAX_WIDTH = 768;

/**
 * True quando a viewport é estreita (mobile). SSR-safe: começa em `false`
 * (desktop) e ajusta no cliente via matchMedia, reagindo a redimensionamentos.
 * Substitui o antigo switch manual mobile/desktop do protótipo (UI-A02).
 */
export function useIsMobile(maxWidth = MOBILE_MAX_WIDTH): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [maxWidth]);
  return isMobile;
}
