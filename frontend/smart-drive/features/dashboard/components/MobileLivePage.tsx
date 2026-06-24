'use client';

import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Stat } from '@/features/shared/ui/primitives';
import { Speedometer, Wave, AxisBars } from '@/features/shared/ui/map-gauges';
import dynamic from 'next/dynamic';
import {
  useTelemetryStore,
  useLastPoint,
  useDrivingEvents,
  useDrivingScore,
  useFuelEstimate,
  useAccelHistory,
  useLiveStatus,
  isValidSpeed,
} from '@/features/shared/realtime';
import { EVENT_META, G, SCORE_HINT, isHighSeverity } from '../derive';

// Mapa real (MapLibre) carregado só no cliente — mesmo padrão do dashboard desktop (FIX-04).
const LiveMapContainer = dynamic(
  () => import('@/features/map/components/LiveMapContainer').then((m) => m.LiveMapContainer),
  { ssr: false, loading: () => <div style={{ position: 'absolute', inset: 0, background: SD.bg }} /> },
);

type MobileTab = 'home' | 'live' | 'map' | 'trips' | 'menu';

export function MobileLivePage({ onNavigate }: { onNavigate?: (tab: MobileTab) => void }) {
  const tripId = useTelemetryStore((s) => s.tripId);

  if (!tripId) return <EmptyState onNavigate={onNavigate} />;

  return (
    <div style={{ padding: '8px 18px 24px', display: 'grid', gap: 14 }}>
      <Header />
      <ReconnectBanner />
      <HeroSpeed />
      <KpiGrid />
      <MiniMap onNavigate={onNavigate} />
      <AccelCard />
      <LatestEvent />
    </div>
  );
}

function Header() {
  const tripId = useTelemetryStore((s) => s.tripId);
  const { status } = useLiveStatus();
  const tone = status === 'live' ? 'cyan' : status === 'offline' ? 'red' : 'yellow';
  const label = { live: 'AO VIVO', reconnecting: 'RECONECTANDO', polling: 'POLLING', offline: 'OFFLINE' }[status];
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <Tag tone={tone}><Dot tone={tone} size={5} pulse={status !== 'offline'} /> {label}</Tag>
        <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, marginTop: 4 }}>{tripId}</div>
      </div>
      <Btn tone="ghost" size="sm" icon={Icon.stop(10)} disabled title="Encerrar viagem (em breve)">PARAR</Btn>
    </div>
  );
}

function ReconnectBanner() {
  const { status } = useLiveStatus();
  if (status !== 'reconnecting' && status !== 'polling') return null;
  return (
    <div style={{
      background: SD.warningSoft, border: `1.5px solid ${SD.warning}`, color: SD.warning,
      padding: '8px 12px', fontFamily: SD.fontMono, fontSize: 11, textAlign: 'center',
    }}>
      ⚠ {status === 'reconnecting' ? 'Conexão perdida · reconectando…' : 'Modo fallback · polling'}
    </div>
  );
}

function HeroSpeed() {
  const point = useLastPoint();
  const valid = isValidSpeed(point?.speedKmh);
  return (
    <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle at 50% 110%, #00E5FF, transparent 60%)' }} />
      <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
        <Speedometer kmh={valid ? (point!.speedKmh as number) : 0} size={240} />
      </div>
      <div className="sd-mono" style={{ textAlign: 'center', fontSize: 11, color: SD.textDim }}>
        {valid ? `${Math.round(point!.speedKmh as number)} km/h` : (point?.speedKmh == null ? 'sem dado' : 'dado inválido')}
      </div>
    </div>
  );
}

function KpiGrid() {
  const score = useDrivingScore();
  const fuel = useFuelEstimate();
  const events = useDrivingEvents();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: SD.border }}>
      <div style={{ background: SD.surface, padding: 14 }}>
        <Stat label="SCORE" value={score ? String(score.value) : '—'} size="md" accent={SD.success} sub={score ? SCORE_HINT[score.classification] : undefined} />
      </div>
      <div style={{ background: SD.surface, padding: 14 }}>
        <Stat label="CONSUMO EST." value={fuel ? fuel.adjustedConsumptionKmL.toFixed(1) : '—'} unit="km/L" size="md" sub={fuel ? `CONF. ${Math.round(fuel.confidenceLevel * 100)}%` : undefined} />
      </div>
      <div style={{ background: SD.surface, padding: 14 }}>
        <Stat label="GASTO" value={fuel?.estimatedCost != null ? `R$ ${fuel.estimatedCost.toFixed(2)}` : '—'} size="md" sub={fuel ? `${fuel.estimatedLitersSpent.toFixed(2)} L` : undefined} />
      </div>
      <div style={{ background: SD.surface, padding: 14 }}>
        <Stat label="EVENTOS" value={String(events.length)} size="md" accent={SD.warning} />
      </div>
    </div>
  );
}

function MiniMap({ onNavigate }: { onNavigate?: (tab: MobileTab) => void }) {
  const point = useLastPoint();
  const hasGps = point != null && point.lat != null && point.lng != null;
  return (
    <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, overflow: 'hidden' }}>
      <div style={{ height: 160, position: 'relative' }}>
        {hasGps ? (
          <LiveMapContainer style={{ position: 'absolute', inset: 0 }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
            textAlign: 'center', gap: 6, color: SD.textDim, background: SD.bg,
          }}>
            <div>{Icon.sat(26, SD.textDim)}</div>
            <div className="sd-mono" style={{ fontSize: 12 }}>GPS indisponível</div>
            <div className="sd-mono" style={{ fontSize: 10, color: SD.textMute }}>aguardando sinal de satélite</div>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${SD.border}` }}>
        <span className="sd-mono" style={{ fontSize: 11, color: hasGps ? SD.text : SD.textDim }}>
          {hasGps ? `${point!.lat.toFixed(4)} / ${point!.lng.toFixed(4)}` : '—'}
        </span>
        <Btn tone="outline" size="sm" onClick={() => onNavigate?.('map')}>EXPANDIR</Btn>
      </div>
    </div>
  );
}

function AccelCard() {
  const point = useLastPoint();
  const accelHistory = useAccelHistory();
  const x = (point?.accelX ?? 0) / G;
  const y = (point?.accelY ?? 0) / G;
  const z = (point?.accelZ ?? G) / G;
  return (
    <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className="sd-label" style={{ fontSize: 10 }}>ACELERÔMETRO</span>
        <span className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>{point ? `|a| ${Math.hypot(x, y, z).toFixed(2)} g` : 'sem dado'}</span>
      </div>
      {/* Tendência real da força g horizontal da viagem (sem dado fabricado). */}
      <Wave width={340} height={48} fill color={SD.primary} points={accelHistory} />
      <div style={{ marginTop: 10 }}>
        <AxisBars x={x} y={y} z={z} width="100%" />
      </div>
    </div>
  );
}

function LatestEvent() {
  const events = useDrivingEvents();
  const e = events[0];
  if (!e) {
    return (
      <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 14, textAlign: 'center', color: SD.textDim, fontSize: 12 }}>
        Nenhum evento detectado ainda.
      </div>
    );
  }
  const high = isHighSeverity(e.severity);
  const color = high ? SD.danger : SD.warning;
  const meta = EVENT_META[e.type];
  const time = new Date(e.timestamp).toLocaleTimeString('pt-BR');
  return (
    <div style={{ position: 'relative', background: SD.surface, border: `1.5px solid ${color}`, padding: 14 }}>
      <Tag tone={high ? 'red' : 'yellow'} style={{ marginBottom: 8 }}>EVENTO · {time}</Tag>
      <div className="sd-display" style={{ fontSize: 20, lineHeight: 1 }}>{(e.description || meta.label).toUpperCase()}</div>
      <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, marginTop: 6 }}>
        {meta.label} · valor {e.value.toFixed(2)} (limiar {e.threshold.toFixed(2)})
      </div>
    </div>
  );
}

function EmptyState({ onNavigate }: { onNavigate?: (tab: MobileTab) => void }) {
  return (
    <div style={{ padding: '60px 24px', display: 'grid', placeItems: 'center', textAlign: 'center', gap: 16 }}>
      <div style={{ color: SD.textDim }}>{Icon.car(44, SD.textDim)}</div>
      <div className="sd-display" style={{ fontSize: 18 }}>NENHUMA VIAGEM ATIVA</div>
      <div style={{ color: SD.textDim, fontSize: 13, lineHeight: 1.5, maxWidth: 280 }}>
        Inicie uma viagem ou rode o modo demo para ver a telemetria em tempo real.
      </div>
      <div style={{ display: 'grid', gap: 10, width: '100%', maxWidth: 280 }}>
        <Btn tone="primary" size="lg" icon={Icon.play(14)} full onClick={() => onNavigate?.('menu')}>INICIAR VIAGEM</Btn>
        <Btn tone="outline" size="lg" full onClick={() => onNavigate?.('menu')}>MODO DEMO</Btn>
      </div>
    </div>
  );
}
