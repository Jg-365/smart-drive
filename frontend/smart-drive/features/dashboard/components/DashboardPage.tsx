'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Stat } from '@/features/shared/ui/primitives';
import { Speedometer, ArcGauge, Wave, AxisBars } from '@/features/shared/ui/map-gauges';

// Mapa real (MapLibre) só no cliente — mesmo padrão da tela Mapa (G03).
const LiveMapContainer = dynamic(
  () => import('@/features/map/components/LiveMapContainer').then((m) => m.LiveMapContainer),
  { ssr: false, loading: () => <div style={{ position: 'absolute', inset: 0, background: SD.bg }} /> },
);
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
import type { DrivingEvent } from '@/features/shared/types';
import { EVENT_META, G, SCORE_HINT, isHighSeverity } from '../derive';

/** Top-level: empty state sem viagem ativa, senão o dashboard ligado ao store. */
type DashScreen = 'dashboard' | 'trips' | 'vehicles' | 'devices' | 'demo';

export function DashboardPage({ onNavigate }: { onNavigate?: (s: DashScreen) => void }) {
  const tripId = useTelemetryStore((s) => s.tripId);
  const [follow, setFollow] = useState(false);
  if (!tripId) return <EmptyState onNavigate={onNavigate} />;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1.8fr 1fr', gridTemplateRows: 'minmax(0, 1fr) minmax(190px, 240px)',
      height: '100%', gap: 1, background: SD.border,
    }}>
      {/* Map */}
      <div style={{ gridColumn: 1, gridRow: '1 / 3', position: 'relative', background: SD.bg }}>
        <LiveMapContainer follow={follow} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 1 }}>
          <StatusTag />
        </div>
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 1 }}>
          <Btn tone={follow ? 'primary' : 'solid'} size="sm" onClick={() => setFollow((f) => !f)}>
            {follow ? 'SEGUINDO ✓' : 'SEGUIR VEÍCULO'}
          </Btn>
        </div>
        <ReconnectBanner />
        <VehicleInfoCard />
      </div>

      {/* Right top: metrics */}
      <div style={{
        gridColumn: 2, gridRow: 1, background: SD.bg, padding: 16,
        display: 'grid', gap: 16, gridTemplateRows: 'auto auto minmax(180px, 1fr)', overflow: 'hidden', minHeight: 0,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SpeedCard />
          <ScoreCard />
        </div>
        <KpiStrip />
        <AccelCard />
      </div>

      {/* Right bottom: events timeline */}
      <div style={{ gridColumn: 2, gridRow: 2, background: SD.bg, padding: '0 16px 16px', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${SD.border}`, display: 'flex', justifyContent: 'space-between' }}>
            <span className="sd-display" style={{ fontSize: 13 }}>EVENTOS RECENTES</span>
            <span className="sd-label" style={{ fontSize: 9 }}>AO VIVO</span>
          </div>
          <EventList />
        </div>
      </div>
    </div>
  );
}

// ── Status / conexão ──────────────────────────────────────────────────
function StatusTag() {
  const { status } = useLiveStatus();
  const map = {
    live: { tone: 'cyan' as const, dot: 'cyan' as const, label: 'LIVE' },
    reconnecting: { tone: 'yellow' as const, dot: 'yellow' as const, label: 'RECONECTANDO' },
    polling: { tone: 'yellow' as const, dot: 'yellow' as const, label: 'POLLING' },
    offline: { tone: 'red' as const, dot: 'red' as const, label: 'OFFLINE' },
  }[status];
  return <Tag tone={map.tone}><Dot tone={map.dot} size={6} pulse={status !== 'offline'} /> {map.label}</Tag>;
}

function ReconnectBanner() {
  const { status } = useLiveStatus();
  if (status !== 'reconnecting' && status !== 'polling') return null;
  const msg = status === 'reconnecting'
    ? 'CONEXÃO PERDIDA · reconectando…'
    : 'MODO FALLBACK · atualizando por polling';
  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      background: SD.warningSoft, border: `1.5px solid ${SD.warning}`, color: SD.warning,
      padding: '6px 14px', fontFamily: SD.fontMono, fontSize: 11, letterSpacing: '.04em',
    }}>
      ⚠ {msg}
    </div>
  );
}

function VehicleInfoCard() {
  const point = useLastPoint();
  const hasGps = point != null && point.lat != null && point.lng != null;
  return (
    <div style={{
      position: 'absolute', left: 16, bottom: 16, zIndex: 1,
      background: SD.surface, border: `1.5px solid ${SD.primary}`,
      padding: '10px 14px', minWidth: 220,
    }}>
      <div className="sd-label" style={{ fontSize: 9, color: SD.primary, marginBottom: 4 }}>VEÍCULO</div>
      <div className="sd-mono" style={{ fontSize: 11 }}>
        {hasGps ? (
          <>
            <div>LAT  <span style={{ color: SD.text }}>{point!.lat.toFixed(5)}</span></div>
            <div>LNG  <span style={{ color: SD.text }}>{point!.lng.toFixed(5)}</span></div>
            <div>SPD  <span style={{ color: SD.text }}>{isValidSpeed(point!.speedKmh) ? `${Math.round(point!.speedKmh)} km/h` : '—'}</span></div>
          </>
        ) : (
          <div style={{ color: SD.textDim }}>GPS indisponível</div>
        )}
      </div>
    </div>
  );
}

// ── Velocidade ────────────────────────────────────────────────────────
function SpeedCard() {
  const point = useLastPoint();
  const valid = isValidSpeed(point?.speedKmh);
  const kmh = valid ? (point!.speedKmh as number) : 0;
  return (
    <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 12 }}>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>VELOCIDADE</div>
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <Speedometer kmh={kmh} size={220} />
      </div>
      <div className="sd-mono" style={{ textAlign: 'center', fontSize: 10, color: SD.textDim, marginTop: -8 }}>
        {valid ? `${Math.round(kmh)} km/h` : (point?.speedKmh == null ? 'sem dado' : 'dado inválido')}
      </div>
    </div>
  );
}

// ── Score ─────────────────────────────────────────────────────────────
function ScoreCard() {
  const score = useDrivingScore();
  return (
    <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 12 }}>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>SCORE</div>
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <ArcGauge value={score?.value ?? 0} hint={score ? SCORE_HINT[score.classification] : 'AGUARDANDO'} size={200} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: SD.textDim }} className="sd-mono">
        <span>{score?.penalties.hardBrakes ?? 0} FREADAS</span>
        <span>{score?.penalties.sharpTurns ?? 0} CURVAS</span>
        <span>{score?.penalties.speedInstability ?? 0} VEL</span>
      </div>
    </div>
  );
}

// ── KPIs (consumo) ────────────────────────────────────────────────────
function KpiStrip() {
  const fuel = useFuelEstimate();
  const kpis = [
    { l: 'DISTÂNCIA', v: '—', u: 'km' },
    { l: 'TEMPO', v: '—', u: 'min' },
    {
      l: 'CONSUMO EST.',
      v: fuel ? fuel.adjustedConsumptionKmL.toFixed(1) : '—',
      u: 'km/L',
      sub: fuel ? `CONF. ${Math.round(fuel.confidenceLevel * 100)}%` : undefined,
    },
    {
      l: 'LITROS',
      v: fuel ? fuel.estimatedLitersSpent.toFixed(2) : '—',
      u: 'L',
      sub: fuel?.estimatedCost != null ? `R$ ${fuel.estimatedCost.toFixed(2)}` : undefined,
    },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: SD.border, border: `1.5px solid ${SD.border}` }}>
      {kpis.map((k, i) => (
        <div key={i} style={{ background: SD.surface, padding: '12px 14px' }}>
          <Stat label={k.l} value={k.v} unit={k.u} size="md" sub={k.sub} />
        </div>
      ))}
    </div>
  );
}

// ── Acelerômetro ──────────────────────────────────────────────────────
function AccelCard() {
  const point = useLastPoint();
  const accelHistory = useAccelHistory();
  const x = (point?.accelX ?? 0) / G;
  const y = (point?.accelY ?? 0) / G;
  const z = (point?.accelZ ?? G) / G;
  return (
    <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 14, display: 'grid', gap: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="sd-label" style={{ fontSize: 10 }}>ACELERÔMETRO</span>
        <span className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>
          {point ? `|a| ${Math.hypot(x, y, z).toFixed(2)} g` : 'sem dado'}
        </span>
      </div>
      {/* Tendência real da força g horizontal da viagem (sem dado fabricado). */}
      <Wave width={360} height={48} color={SD.primary} fill points={accelHistory} />
      <AxisBars x={x} y={y} z={z} width="100%" />
    </div>
  );
}

// ── Eventos ───────────────────────────────────────────────────────────
function EventList() {
  const events = useDrivingEvents();

  if (events.length === 0) {
    return (
      <div style={{ padding: '24px 14px', textAlign: 'center', color: SD.textDim, fontSize: 12 }}>
        Nenhum evento detectado ainda.
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', minHeight: 0 }}>
      {events.slice(0, 6).map((e: DrivingEvent, i: number) => {
        const meta = EVENT_META[e.type];
        const high = isHighSeverity(e.severity);
        const color = high ? SD.danger : SD.warning;
        const bg = high ? SD.dangerSoft : SD.warningSoft;
        const time = new Date(e.timestamp).toLocaleTimeString('pt-BR');
        return (
          <div
            key={e.id}
            className="sd-hover-row"
            style={{
              display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 12, alignItems: 'center',
              padding: '12px 14px', borderBottom: i < Math.min(events.length, 6) - 1 ? `1px solid ${SD.border}` : 'none',
            }}
          >
            <div style={{
              width: 28, height: 28, background: bg, border: `1.5px solid ${color}`,
              display: 'grid', placeItems: 'center', color,
            }}>
              {meta.icon(14)}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{e.description || meta.label}</div>
              <div className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>{time} · {e.type}</div>
            </div>
            <div className="sd-mono" style={{ fontSize: 11, color }}>
              {e.value.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Estado vazio ──────────────────────────────────────────────────────
function EmptyState({ onNavigate }: { onNavigate?: (s: DashScreen) => void }) {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', background: SD.bg, padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ color: SD.textDim, marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          {Icon.car(48, SD.textDim)}
        </div>
        <div className="sd-display" style={{ fontSize: 20, marginBottom: 8 }}>NENHUMA VIAGEM ATIVA</div>
        <div style={{ color: SD.textDim, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          Inicie uma viagem ou rode o modo demo para ver a telemetria em tempo real.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Btn tone="primary" size="lg" icon={Icon.play(14)} onClick={() => onNavigate?.('demo')}>INICIAR VIAGEM</Btn>
          <Btn tone="outline" size="lg" onClick={() => onNavigate?.('demo')}>MODO DEMO</Btn>
        </div>
      </div>
    </div>
  );
}
