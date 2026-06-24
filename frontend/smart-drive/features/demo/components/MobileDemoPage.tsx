'use client';

import React, { useRef, useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn } from '@/features/shared/ui/primitives';
import {
  useConnection, useDrivingScore, useLastPoint, useTelemetryStore, isValidSpeed,
} from '@/features/shared/realtime';
import { useStartDemo, useResetDemo } from '../hooks';

type DemoMode = 'smooth' | 'normal' | 'aggressive';

const PROFILES: { id: DemoMode; label: string; tone: string }[] = [
  { id: 'smooth', label: 'SUAVE', tone: SD.success },
  { id: 'normal', label: 'NORMAL', tone: SD.primary },
  { id: 'aggressive', label: 'AGRESSIVA', tone: SD.danger },
];

type MobileTab = 'home' | 'live' | 'map' | 'trips' | 'menu';

export function MobileDemoPage({ onNavigate }: { onNavigate?: (tab: MobileTab) => void } = {}) {
  const startM = useStartDemo();
  const resetM = useResetDemo();
  const connection = useConnection();
  const score = useDrivingScore();
  const lastPoint = useLastPoint();

  const [mode, setMode] = useState<DemoMode>('normal');
  const startingRef = useRef(false);
  const isRunning = connection === 'live';
  const speed = lastPoint && isValidSpeed(lastPoint.speedKmh) ? lastPoint.speedKmh : null;

  const handleStart = () => {
    if (startingRef.current || isRunning) return;
    startingRef.current = true;
    startM.mutate(
      { scenario: mode },
      {
        onSuccess: (s) => {
          const store = useTelemetryStore.getState();
          store.setTrip(s.tripId);
          store.setConnection('live');
          store.setDemoMode(true);
        },
        onSettled: () => { startingRef.current = false; },
      },
    );
  };

  const handleReset = () => {
    resetM.mutate(undefined, { onSuccess: () => useTelemetryStore.getState().reset() });
  };

  return (
    <div style={{ height: '100%', position: 'relative', background: SD.bg }}>
        <div style={{
          padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${SD.border}`,
        }}>
          <Tag tone="cyan"><Dot tone="cyan" size={5} /> EXPOIOT</Tag>
          {isRunning
            ? <Tag tone="red"><Dot tone="red" size={5} /> AO VIVO</Tag>
            : <Tag tone="neutral">PARADO</Tag>}
        </div>

        <div style={{ padding: 18, display: 'grid', gap: 14 }}>
          <div>
            <div className="sd-label" style={{ fontSize: 9, color: SD.primary }}>MODO APRESENTAÇÃO</div>
            <div className="sd-display" style={{ fontSize: 22, lineHeight: 1 }}>CARRINHO RC<br />NA PISTA</div>
          </div>

          {/* Live readouts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: SD.border, border: `2px solid ${SD.danger}` }}>
            <div style={{ background: SD.bg, padding: 16 }}>
              <div className="sd-label" style={{ fontSize: 9, color: SD.danger, marginBottom: 4 }}>SCORE</div>
              <div className="sd-mono" style={{ fontSize: 48, color: SD.danger, lineHeight: 1, fontWeight: 700 }}>
                {score ? Math.round(score.value) : '—'}
              </div>
            </div>
            <div style={{ background: SD.bg, padding: 16 }}>
              <div className="sd-label" style={{ fontSize: 9, color: SD.primary, marginBottom: 4 }}>VEL.</div>
              <div className="sd-mono" style={{ fontSize: 48, color: SD.text, lineHeight: 1, fontWeight: 700 }}>
                {speed != null ? speed : '—'}
              </div>
              <div className="sd-label" style={{ fontSize: 9, color: SD.textDim, marginTop: 4 }}>KM/H</div>
            </div>
          </div>

          {/* Profile selector */}
          <div className="sd-label" style={{ fontSize: 9 }}>PERFIL DE CONDUÇÃO</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {PROFILES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-label={`Perfil ${m.label}`}
                  aria-pressed={active}
                  onClick={() => setMode(m.id)}
                  className="sd-btn"
                  style={{
                    padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                    minHeight: 44, // alvo de toque mínimo (JOA-RNF-03)
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${active ? m.tone : SD.border}`,
                    background: active ? `${m.tone}15` : SD.surface,
                  }}
                >
                  <span className="sd-label" style={{ fontSize: 10, color: active ? m.tone : SD.text }}>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <Btn
              tone="primary" size="lg" full icon={Icon.play(14)}
              onClick={handleStart}
              style={isRunning || startM.isPending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
            >
              {isRunning ? 'EM ANDAMENTO' : startM.isPending ? 'INICIANDO…' : 'INICIAR DEMO'}
            </Btn>
            <Btn tone="ghost" size="lg" full icon={Icon.reset(12)} onClick={handleReset}>RESET</Btn>
          </div>

          <div style={{ padding: 12, background: 'rgba(255,176,32,0.08)', border: `1px solid ${SD.warning}`, fontSize: 11, color: SD.textDim }}>
            <strong style={{ color: SD.warning }}>ⓘ</strong> Sem GPS, usa a pista virtual. Consumo estimado pelo comportamento + perfil do veículo.
          </div>
        </div>
    </div>
  );
}
