'use client';

import dynamic from 'next/dynamic';
import { sdVars as SD } from '@/lib/sd-vars';
import { Tag, Dot } from '@/features/shared/ui/primitives';
import { useLiveStatus, type LiveStatus } from '@/features/shared/realtime';

// MapLibre só no cliente (usa WebGL/window) — evita quebra no SSR do Next (G03).
const LiveMapContainer = dynamic(
  () => import('./LiveMapContainer').then((m) => m.LiveMapContainer),
  { ssr: false, loading: () => <div style={{ position: 'absolute', inset: 0, background: SD.bg }} /> },
);

const STATUS_LABEL: Record<LiveStatus, string> = {
  live: 'AO VIVO', reconnecting: 'RECONECTANDO', polling: 'POLLING', offline: 'OFFLINE',
};
function statusTone(s: LiveStatus): 'cyan' | 'yellow' | 'red' {
  return s === 'live' ? 'cyan' : s === 'offline' ? 'red' : 'yellow';
}

/**
 * Tela de mapa do layout desktop (JOA-RF-04). Renderiza o mapa MapLibre real em
 * tela cheia, ligado ao store de telemetria via LiveMapContainer. O zoom é o
 * NavigationControl nativo do MapLibre (canto inferior direito do LiveMap).
 */
export function DesktopMapPage() {
  const { status } = useLiveStatus();
  const tone = statusTone(status);
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <LiveMapContainer style={{ position: 'absolute', inset: 0 }} />
      {/* Status real da conexão (não um 'AO VIVO' fixo) — auditoria UI-002. */}
      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <Tag tone={tone}><Dot tone={tone} size={5} pulse={status !== 'offline'} /> {STATUS_LABEL[status]}</Tag>
      </div>
    </div>
  );
}

export default DesktopMapPage;
