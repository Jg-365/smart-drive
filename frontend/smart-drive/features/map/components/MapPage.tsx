'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Stat } from '@/features/shared/ui/primitives';
import {
  useTelemetryStore,
  useLastPoint,
  useDrivingEvents,
  useLiveStatus,
  isValidSpeed,
  type LiveStatus,
} from '@/features/shared/realtime';
import { useVehicles } from '@/features/vehicles/hooks';

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

export function MapPage({ onBack }: { onBack?: () => void }) {
  const tripId = useTelemetryStore((s) => s.tripId);
  const point = useLastPoint();
  const events = useDrivingEvents();
  const { status } = useLiveStatus();
  const { data: vehicles } = useVehicles();
  const vehicle = vehicles?.[0];
  const [follow, setFollow] = useState(true);

  // Sem viagem ativa não há o que mapear — estado honesto, sem mapa fabricado.
  if (!tripId) {
    return (
      <div style={{ padding: '60px 24px', display: 'grid', placeItems: 'center', textAlign: 'center', gap: 16, height: '100%', alignContent: 'center' }}>
        <div style={{ color: SD.textDim }}>{Icon.map(44, SD.textDim)}</div>
        <div className="sd-display" style={{ fontSize: 18 }}>NENHUMA VIAGEM ATIVA</div>
        <div style={{ color: SD.textDim, fontSize: 13, lineHeight: 1.5, maxWidth: 280 }}>
          Inicie uma viagem ou rode o modo demo para acompanhar o trajeto no mapa em tempo real.
        </div>
        {onBack && <Btn tone="outline" size="md" onClick={onBack}>VOLTAR</Btn>}
      </div>
    );
  }

  const hasGps = point != null && point.lat != null && point.lng != null;
  const validSpeed = isValidSpeed(point?.speedKmh);
  const tone = statusTone(status);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
        {/* Mapa real só quando há fix de GPS; senão, indisponibilidade honesta (sem rota fabricada). */}
        {hasGps ? (
          <LiveMapContainer follow={follow} style={{ position: 'absolute', inset: 0 }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
            textAlign: 'center', gap: 8, color: SD.textDim, background: SD.bg, alignContent: 'center',
          }}>
            <div>{Icon.sat(30, SD.textDim)}</div>
            <div className="sd-mono" style={{ fontSize: 13 }}>GPS indisponível</div>
            <div className="sd-mono" style={{ fontSize: 11, color: SD.textMute }}>aguardando sinal de satélite</div>
          </div>
        )}

        {/* Top overlay: voltar + seguir (toggle real do modo follow do mapa) */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 8 }}>
          <Btn tone="solid" size="sm" icon={Icon.back(12)} style={{ background: SD.bg }} onClick={onBack} disabled={!onBack}>VOLTAR</Btn>
          <div style={{ flex: 1 }} />
          <Btn
            tone={follow ? 'primary' : 'solid'}
            size="sm"
            style={follow ? undefined : { background: SD.bg }}
            disabled={!hasGps}
            title={hasGps ? undefined : 'Sem GPS para seguir'}
            onClick={() => setFollow((f) => !f)}
          >
            {follow ? 'SEGUINDO' : 'SEGUIR'}
          </Btn>
        </div>

        {/* Card de telemetria ao vivo (dados reais do store) — ancorado no topo para
            não cobrir o controle de zoom nativo do MapLibre (canto inferior-direito). */}
        <div style={{
          position: 'absolute', top: 56, left: 12, right: 12,
          background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div className="sd-label" style={{ fontSize: 9, color: SD.primary }}>VEÍCULO</div>
              <div className="sd-display" style={{ fontSize: 14 }}>
                {vehicle ? `${vehicle.brand} ${vehicle.model}`.toUpperCase() : '—'}
              </div>
            </div>
            <Tag tone={tone}>
              <Dot tone={tone} size={5} pulse={status !== 'offline'} /> {STATUS_LABEL[status]}
            </Tag>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, paddingTop: 10, borderTop: `1px dashed ${SD.border}` }}>
            <Stat
              label="VELOCIDADE"
              value={validSpeed ? String(Math.round(point!.speedKmh as number)) : '—'}
              unit="km/h" size="sm"
            />
            <Stat
              label="SATÉLITES"
              value={typeof point?.satellites === 'number' ? String(point.satellites) : '—'}
              size="sm"
            />
            <Stat label="EVENTOS" value={String(events.length)} size="sm" accent={SD.warning} />
          </div>
        </div>
    </div>
  );
}
