'use client';

import React, { useRef, useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn } from '@/features/shared/ui/primitives';
import { useVehicles } from '@/features/vehicles';
import {
  useConnection, useDrivingScore, useLastPoint, useTelemetryStore,
} from '@/features/shared/realtime';
import { isValidSpeed } from '@/features/shared/realtime';
import { useStartDemo, useResetDemo } from '../hooks';

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
  const lastPoint = useLastPoint();

  const [vehicleId, setVehicleId] = useState<string | undefined>(undefined);
  const startingRef = useRef(false);

  const isRunning = connection === 'live';

  const handleStart = () => {
    // Trava síncrona: evita criar duas sessões em cliques rápidos (JOA-RF-05 edge).
    if (startingRef.current || isRunning) return;
    startingRef.current = true;
    startM.mutate(
      { scenario: mode, vehicleId },
      {
        onSuccess: (s) => {
          const store = useTelemetryStore.getState();
          store.setTrip(s.tripId);
          store.setConnection('live');
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

  const speed = lastPoint && isValidSpeed(lastPoint.speedKmh) ? lastPoint.speedKmh : null;

  return (
    <div style={{
      height: '100%', overflow: 'hidden', background: SD.bg,
      display: 'grid', gridTemplateColumns: '320px 1fr 320px', gap: 1,
    }}>
      {/* LEFT: control panel */}
      <div style={{ background: SD.surface, borderRight: `1px solid ${SD.border}`, padding: 20, overflow: 'auto' }}>
        <Tag tone="cyan" style={{ marginBottom: 10 }}><Dot tone="cyan" size={5} /> EXPOIOT 2026</Tag>
        <div className="sd-display" style={{ fontSize: 22, lineHeight: 1, marginTop: 10 }}>MODO<br />APRESENTAÇÃO</div>
        <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, marginTop: 8, lineHeight: 1.5 }}>
          Pista física + carrinho RC com ESP32. O modelo trata o comportamento como se viesse de um veículo real.
        </div>

        {/* Vehicle select */}
        <div className="sd-label" style={{ fontSize: 9, margin: '18px 0 8px' }}>VEÍCULO SIMULADO</div>
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

      {/* CENTER: stage */}
      <div style={{ background: SD.bg, position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {isRunning
                ? <Tag tone="red"><Dot tone="red" size={5} /> AO VIVO</Tag>
                : <Tag tone="neutral">PARADO</Tag>}
              <Tag tone="cyan">CARRINHO RC · esp32-demo-001</Tag>
              <Tag>PERFIL: {mode.toUpperCase()}</Tag>
            </div>
            <div className="sd-display" style={{ fontSize: 26 }}>PISTA · CIRCUITO URBANO</div>
          </div>
        </div>

        <div style={{ padding: 24, height: 'calc(100% - 96px)' }}>
          <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, height: '100%', position: 'relative', overflow: 'hidden' }}>
            <TrackView />
            {/* Score overlay (ao vivo via store) */}
            <div style={{ position: 'absolute', top: 20, left: 20, padding: 16, background: SD.bg, border: `2px solid ${SD.danger}` }}>
              <div className="sd-label" style={{ fontSize: 9, color: SD.danger, marginBottom: 4 }}>SCORE AO VIVO</div>
              <div className="sd-mono" style={{ fontSize: 56, color: SD.danger, lineHeight: 1, fontWeight: 700 }}>
                {score ? Math.round(score.value) : '—'}
              </div>
            </div>
            {/* Speed overlay */}
            <div style={{ position: 'absolute', top: 20, right: 20, padding: 16, background: SD.bg, border: `2px solid ${SD.primary}` }}>
              <div className="sd-label" style={{ fontSize: 9, color: SD.primary, marginBottom: 4 }}>VELOCIDADE</div>
              <div className="sd-mono" style={{ fontSize: 56, color: SD.text, lineHeight: 1, fontWeight: 700 }}>
                {speed != null ? speed : '—'}
              </div>
              <div className="sd-label" style={{ fontSize: 9, color: SD.textDim, marginTop: 4 }}>KM/H</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: model explanation */}
      <div style={{ background: SD.surface, borderLeft: `1px solid ${SD.border}`, padding: 20, overflow: 'auto' }}>
        <div className="sd-label" style={{ fontSize: 9, marginBottom: 8, color: SD.primary }}>EXPLICAÇÃO DO MODELO</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: SD.textDim, marginBottom: 12 }}>
          O carrinho demonstra a coleta de telemetria. O modelo aplica o consumo base do perfil cadastrado:
        </div>
        <div style={{
          background: SD.bg, border: `1px solid ${SD.border}`,
          padding: 12, fontFamily: SD.fontMono, fontSize: 10, color: SD.textDim, lineHeight: 1.7,
        }}>
          <span style={{ color: SD.primary }}>consumo</span> = <span style={{ color: SD.text }}>baseKmL</span>
          <br />&nbsp;&nbsp;× fatorVelocidade × fatorAceleracao
          <br />&nbsp;&nbsp;× fatorFrenagem × <span style={{ color: SD.warning }}>fatorRota</span>
          <br />&nbsp;&nbsp;× <span style={{ color: SD.success }}>fatorCalibracao</span>
        </div>

        <div style={{
          marginTop: 14, padding: 12,
          background: 'rgba(0,229,255,0.06)', border: `1px solid ${SD.primary}`,
          fontSize: 11, color: SD.text, lineHeight: 1.5,
        }}>
          <strong style={{ color: SD.primary }}>ⓘ SEM GPS?</strong>
          <div style={{ marginTop: 4, color: SD.textDim }}>
            Se o GPS cair, a posição usa a <strong>pista virtual</strong> e o trajeto continua sem
            interromper a apresentação (coordenadas inválidas são ignoradas no traçado).
          </div>
        </div>

        <div style={{
          marginTop: 14, padding: 12,
          background: 'rgba(255,176,32,0.08)', border: `1px solid ${SD.warning}`,
          fontSize: 11, color: SD.text, lineHeight: 1.5,
        }}>
          <strong style={{ color: SD.warning }}>ⓘ ESTIMATIVA HONESTA</strong>
          <div style={{ marginTop: 4, color: SD.textDim }}>
            Não medimos combustível no tanque. O número é proporcional ao comportamento detectado pelo IMU + GPS.
          </div>
        </div>
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

function TrackView() {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-label="Pista virtual">
      <rect width="800" height="500" fill="#0E0E16" />
      {Array.from({ length: 16 }).map((_, i) => (
        <line key={'h' + i} x1="0" y1={i * 32} x2="800" y2={i * 32} stroke="#1A1A26" strokeWidth="1" />
      ))}
      {Array.from({ length: 26 }).map((_, i) => (
        <line key={'v' + i} x1={i * 32} y1="0" x2={i * 32} y2="500" stroke="#1A1A26" strokeWidth="1" />
      ))}
      <path
        d="M 120 250 C 120 120, 280 80, 400 130 C 520 180, 520 320, 640 320 C 760 320, 760 180, 640 180 C 520 180, 520 380, 400 380 C 280 380, 120 380, 120 250 Z"
        fill="none" stroke="#2A2A38" strokeWidth="40"
      />
      <path
        d="M 120 250 C 120 120, 280 80, 400 130 C 520 180, 520 320, 640 320 C 760 320, 760 180, 640 180 C 520 180, 520 380, 400 380 C 280 380, 120 380, 120 250 Z"
        fill="none" stroke={SD.primary} strokeWidth="2" strokeDasharray="6 4" opacity="0.6"
      />
      <g transform="translate(120 250)">
        <rect x="-4" y="-30" width="8" height="60" fill={SD.success} />
        <text x="14" y="-32" fill={SD.textDim} fontSize="10" fontFamily={SD.fontMono}>START</text>
      </g>
    </svg>
  );
}
