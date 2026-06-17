'use client';

import dynamic from 'next/dynamic';
import { sdVars as SD } from '@/lib/sd-vars';
import { Tag, Dot } from '@/features/shared/ui/primitives';

// MapLibre só no cliente (usa WebGL/window) — evita quebra no SSR do Next (G03).
const LiveMapContainer = dynamic(
  () => import('./LiveMapContainer').then((m) => m.LiveMapContainer),
  { ssr: false, loading: () => <div style={{ position: 'absolute', inset: 0, background: SD.bg }} /> },
);

/**
 * Tela de mapa do layout desktop (JOA-RF-04). Renderiza o mapa MapLibre real em
 * tela cheia, ligado ao store de telemetria via LiveMapContainer. O zoom é o
 * NavigationControl nativo do MapLibre (canto inferior direito do LiveMap).
 */
export function DesktopMapPage() {
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <LiveMapContainer style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <Tag tone="red"><Dot tone="red" size={5} /> AO VIVO</Tag>
      </div>
    </div>
  );
}

export default DesktopMapPage;
