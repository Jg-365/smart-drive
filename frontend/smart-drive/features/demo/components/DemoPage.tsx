'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Stat } from '@/features/shared/ui/primitives';
import { useVehicles } from '@/features/vehicles';
import {
  useConnection, useDrivingScore, useFuelEstimate, useLastPoint, useTelemetryStore,
  isValidSpeed,
} from '@/features/shared/realtime';
import { useStartDemo, useResetDemo } from '../hooks';

// Mapa real (MapLibre) só no cliente — o carrinho é o marcador do veículo, que se
// move com o GPS ao vivo do ESP32 (decisão: demo ao vivo). Sem retângulo verde.
const LiveMapContainer = dynamic(
  () => import('@/features/map/components/LiveMapContainer').then((m) => m.LiveMapContainer),
  { ssr: false, loading: () => <div style={{ position: 'absolute', inset: 0, background: SD.bg }} /> },
);

type DemoMode = 'smooth' | 'normal' | 'aggressive';

interface DemoPageProps {
  mode?: DemoMode;
  onMode?: (m: DemoMode) => void;
}

const PROFILES: { id: DemoMode; label: string; desc: string; tone: string }[] = [
  { id: 'smooth', label: 'SUAVE', desc: 'Acelerações graduais e curvas leves', tone: SD.success },
  { id: 'normal', label: 'NORMAL', desc: 'Mistura de comportamentos urbanos', tone: SD.primary },
  { id: 'aggressive', label: 'AGRESSIVA', desc: 'Freadas, acelerações e curvas fortes', tone: SD.danger },
];

export function DemoPage({ mode = 'normal', onMode }: DemoPageProps) {
  const vehicles = useVehicles();
  const startM = useStartDemo();
  const resetM = useResetDemo();

  const connection = useConnection();
  const score = useDrivingScore();
  const fuel = useFuelEstimate();
  const lastPoint = useLastPoint();

  const [vehicleId, setVehicleId] = useState<string | undefined>(undefined);
  const startingRef = useRef(false);

  const isRunning = connection === 'live';
  const hasFix = lastPoint != null && lastPoint.lat != null && lastPoint.lng != null;
  const speed = lastPoint && isValidSpeed(lastPoint.speedKmh) ? lastPoint.speedKmh : null;

  const handleStart = () => {
    if (startingRef.current || isRunning) return;
    startingRef.current = true;
    startM.mutate(
      { scenario: mode, vehicleId },
      {
        onSuccess: (s) => {
          const store = useTelemetryStore.getState();
          store.setTrip(s.tripId);
          store.setConnection('live');
          store.setDemoMode(true); // marca a sessão como demo (separa do fluxo real)
        },
        onSettled: () => { startingRef.current = false; },
      },
    );
  };

  const handleReset = () => {
    resetM.mutate(undefined, {
      onSuccess: () => useTelemetryStore.getState().reset(),
    });
  };

  return (
    <div style={{
      height: '100%', overflow: 'hidden', background: SD.bg,
      display: 'grid', gridTemplateColumns: '320px 1fr 300px', gap: 1,
    }}>
      {/* LEFT: control panel */}
      <div style={{ background: SD.surface, borderRight: `1px solid ${SD.border}`, padding: 20, overflow: 'auto' }}>
        <Tag tone="cyan" style={{ marginBottom: 10 }}><Dot tone="cyan" size={5} /> EXPOIOT 2026</Tag>
        <div className="sd-display" style={{ fontSize: 22, lineHeight: 1, marginTop: 10 }}>MODO<br />APRESENTAÇÃO</div>

        {/* Vehicle select */}
        <div className="sd-label" style={{ fontSize: 9, margin: '18px 0 8px' }}>VEÍCULO</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <SelectableCard
            active={vehicleId === undefined}
            onClick={() => setVehicleId(undefined)}
            title="Veículo demo padrão"
            sub="Usado quando nenhum é selecionado"
          />
          {(vehicles.data ?? []).map((v) => (
            <SelectableCard
              key={v.id}
              active={vehicleId === v.id}
              onClick={() => setVehicleId(v.id)}
              title={`${v.brand} ${v.model}`}
              sub={`${v.baseMixedConsumptionKmL} km/L · ${v.tankCapacityLiters}L`}
            />
          ))}
        </div>

        {/* Profile */}
        <div className="sd-label" style={{ fontSize: 9, margin: '18px 0 8px' }}>PERFIL DE CONDUÇÃO</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {PROFILES.map((m) => {
            const active = mode === m.id;
            return (
              <div
                key={m.id}
                role="button"
                aria-label={`Perfil ${m.label}`}
                onClick={() => onMode && onMode(m.id)}
                className="sd-btn"
                style={{
                  padding: 12, border: `1.5px solid ${active ? m.tone : SD.border}`,
                  background: active ? `${m.tone}15` : SD.surface2,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="sd-label" style={{ fontSize: 10, color: active ? m.tone : SD.text }}>{m.label}</span>
                  {active && <Dot tone="cyan" size={6} />}
                </div>
                <div style={{ fontSize: 11, color: SD.textDim, lineHeight: 1.4 }}>{m.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ marginTop: 20, display: 'grid', gap: 8 }}>
          {!isRunning ? (
            <Btn
              tone="primary" size="lg" full icon={Icon.play(14)}
              onClick={handleStart}
              style={startM.isPending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
            >
              {startM.isPending ? 'INICIANDO…' : 'INICIAR DEMO'}
            </Btn>
          ) : (
            <Tag tone="red"><Dot tone="red" size={5} /> DEMO ATIVA</Tag>
          )}
          <Btn tone="ghost" size="md" full icon={Icon.reset(12)} onClick={handleReset}>
            {resetM.isPending ? 'RESETANDO…' : 'RESET'}
          </Btn>
          {startM.isError && (
            <div role="alert" className="sd-mono" style={{ fontSize: 11, color: SD.danger }}>
              Falha ao iniciar a demo. Tente novamente.
            </div>
          )}
        </div>
      </div>

      {/* CENTER: live map stage (o carrinho é o marcador que se move com o GPS) */}
      <div style={{ background: SD.bg, position: 'relative', overflow: 'hidden' }}>
        <LiveMapContainer follow style={{ position: 'absolute', inset: 0 }} />

        {/* Header overlay */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 1 }}>
          {isRunning
            ? <Tag tone="red"><Dot tone="red" size={5} /> AO VIVO</Tag>
            : <Tag tone="neutral">PARADO</Tag>}
          <Tag tone="cyan">MODO DEMO</Tag>
          <Tag>PERFIL: {mode.toUpperCase()}</Tag>
        </div>

        {/* Score overlay (ao vivo via store) */}
        <div style={{ position: 'absolute', top: 16, right: 16, padding: 14, background: SD.bg, border: `2px solid ${SD.danger}`, zIndex: 1 }}>
          <div className="sd-label" style={{ fontSize: 9, color: SD.danger, marginBottom: 4 }}>SCORE AO VIVO</div>
          <div className="sd-mono" style={{ fontSize: 44, color: SD.danger, lineHeight: 1, fontWeight: 700 }}>
            {score ? Math.round(score.value) : '—'}
          </div>
        </div>

        {/* Speed overlay */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, padding: 14, background: SD.bg, border: `2px solid ${SD.primary}`, zIndex: 1 }}>
          <div className="sd-label" style={{ fontSize: 9, color: SD.primary, marginBottom: 4 }}>VELOCIDADE</div>
          <div className="sd-mono" style={{ fontSize: 44, color: SD.text, lineHeight: 1, fontWeight: 700 }}>
            {speed != null ? speed : '—'} <span style={{ fontSize: 14, color: SD.textDim }}>km/h</span>
          </div>
        </div>

        {/* GPS ausente: aviso honesto (sem forjar posição) */}
        {isRunning && !hasFix && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 1,
            background: SD.warningSoft, border: `1.5px solid ${SD.warning}`, color: SD.warning,
            padding: '6px 12px', fontFamily: SD.fontMono, fontSize: 11,
          }}>
            ⚠ GPS sem fix — aguardando posição (céu aberto). A telemetria do IMU continua.
          </div>
        )}
      </div>

      {/* RIGHT: estado real consolidado (sem textões) */}
      <div style={{ background: SD.surface, borderLeft: `1px solid ${SD.border}`, padding: 20, overflow: 'auto', display: 'grid', gap: 14, alignContent: 'start' }}>
        <div className="sd-label" style={{ fontSize: 9, color: SD.primary }}>CONSUMO ESTIMADO</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Stat label="CONSUMO" value={fuel ? fuel.adjustedConsumptionKmL.toFixed(1) : '—'} unit="km/L" accent={SD.success} />
          <Stat label="GASTO" value={fuel ? fuel.estimatedLitersSpent.toFixed(2) : '—'} unit="L" />
        </div>
        <div className="sd-mono" style={{ fontSize: 10, color: SD.textMute, lineHeight: 1.5 }}>
          Estimativa proporcional ao comportamento (IMU + GPS), não medição de tanque.
        </div>

        <div style={{ height: 1, background: SD.border }} />

        <div className="sd-label" style={{ fontSize: 9, color: SD.primary }}>EVENTOS (SCORE)</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: SD.textDim }} className="sd-mono">
          <span>{score?.penalties.hardBrakes ?? 0} FREADAS</span>
          <span>{score?.penalties.sharpTurns ?? 0} CURVAS</span>
          <span>{score?.penalties.speedInstability ?? 0} VEL</span>
        </div>
        {!score && (
          <div className="sd-mono" style={{ fontSize: 10, color: SD.textMute }}>
            Score e eventos chegam via WebSocket (análise do Nathan).
          </div>
        )}
      </div>
    </div>
  );
}

function SelectableCard({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <div
      role="button"
      aria-label={title}
      onClick={onClick}
      className="sd-btn"
      style={{
        padding: 12, border: `1.5px solid ${active ? SD.primary : SD.border}`,
        background: active ? 'rgba(0,229,255,0.05)' : SD.surface2,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div className="sd-mono" style={{ fontSize: 10, color: active ? SD.primary : SD.textDim }}>{sub}</div>
    </div>
  );
}
