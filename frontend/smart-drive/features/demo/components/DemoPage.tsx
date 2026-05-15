'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn } from '@/features/shared/ui/primitives';

type DemoMode = 'smooth' | 'normal' | 'aggressive';

interface DemoPageProps {
  mode?: DemoMode;
  onMode?: (m: DemoMode) => void;
}

export function DemoPage({ mode = 'aggressive', onMode }: DemoPageProps) {
  return (
    <div style={{
      height: '100%', overflow: 'hidden', background: SD.bg,
      display: 'grid', gridTemplateColumns: '320px 1fr 320px', gap: 1,
    }}>
      {/* LEFT: Setup */}
      <div style={{ background: SD.surface, borderRight: `1px solid ${SD.border}`, padding: 20, overflow: 'auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Tag tone="cyan" style={{ marginBottom: 10 }}><Dot tone="cyan" size={5} /> EXPOIOT 2026</Tag>
          <div className="sd-display" style={{ fontSize: 22, lineHeight: 1, marginTop: 10 }}>
            MODO<br />APRESENTAÇÃO
          </div>
          <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, marginTop: 8, lineHeight: 1.5 }}>
            Pista física + carrinho RC com ESP32. O modelo trata o comportamento como se viesse de um veículo real.
          </div>
        </div>

        <div className="sd-label" style={{ fontSize: 9, marginBottom: 8 }}>VEÍCULO SIMULADO</div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
          {[
            { brand: 'CHEVROLET', model: 'Onix LT 1.0', cons: '12.4 km/L', tank: '44L', active: true },
            { brand: 'FIAT', model: 'Strada Endurance', cons: '10.8 km/L', tank: '55L', active: false },
            { brand: 'TOYOTA', model: 'Corolla XEi', cons: '13.6 km/L', tank: '50L', active: false },
          ].map((v, i) => (
            <div
              key={i}
              className="sd-btn"
              style={{
                padding: 12, border: `1.5px solid ${v.active ? SD.primary : SD.border}`,
                background: v.active ? 'rgba(0,229,255,0.05)' : SD.surface2,
              }}
            >
              <div className="sd-label" style={{ fontSize: 9, color: SD.textDim, marginBottom: 2 }}>{v.brand}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{v.model}</div>
              <div className="sd-mono" style={{ fontSize: 10, color: v.active ? SD.primary : SD.textDim }}>
                {v.cons} · {v.tank}
              </div>
            </div>
          ))}
        </div>

        <div className="sd-label" style={{ fontSize: 9, marginBottom: 8 }}>PERFIL DE CONDUÇÃO</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {([
            { id: 'smooth' as DemoMode, label: 'SUAVE', desc: 'Acelerações graduais e curvas leves', tone: SD.success },
            { id: 'normal' as DemoMode, label: 'NORMAL', desc: 'Mistura de comportamentos urbanos', tone: SD.primary },
            { id: 'aggressive' as DemoMode, label: 'AGRESSIVA', desc: 'Freadas, acelerações e curvas fortes', tone: SD.danger },
          ]).map((m) => {
            const active = mode === m.id;
            return (
              <div
                key={m.id}
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

        <div style={{ marginTop: 20, display: 'grid', gap: 8 }}>
          <Btn tone="primary" size="lg" full icon={Icon.play(14)}>INICIAR DEMO</Btn>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Btn tone="ghost" size="md" icon={Icon.pause(12)}>PAUSAR</Btn>
            <Btn tone="ghost" size="md" icon={Icon.reset(12)}>RESET</Btn>
          </div>
        </div>
      </div>

      {/* CENTER: Stage */}
      <div style={{ background: SD.bg, position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Tag tone="red"><Dot tone="red" size={5} /> AO VIVO</Tag>
              <Tag tone="cyan">CARRINHO RC · esp32-demo-001</Tag>
              <Tag>PERFIL: AGRESSIVA</Tag>
            </div>
            <div className="sd-display" style={{ fontSize: 26 }}>PISTA · CIRCUITO URBANO</div>
          </div>
          <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, textAlign: 'right' }}>
            <div>VOLTA <span style={{ color: SD.text, fontSize: 22 }}>03</span> / 05</div>
            <div>TEMPO 01:42</div>
          </div>
        </div>

        {/* Track */}
        <div style={{ padding: 24, height: 'calc(100% - 96px)' }}>
          <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, height: '100%', position: 'relative', overflow: 'hidden' }}>
            <TrackView />
            {/* Score overlay */}
            <div style={{ position: 'absolute', top: 20, left: 20, padding: 16, background: SD.bg, border: `2px solid ${SD.danger}` }}>
              <div className="sd-label" style={{ fontSize: 9, color: SD.danger, marginBottom: 4 }}>SCORE AO VIVO</div>
              <div className="sd-mono" style={{ fontSize: 56, color: SD.danger, lineHeight: 1, fontWeight: 700 }}>42</div>
              <div className="sd-label" style={{ fontSize: 9, color: SD.danger, marginTop: 4 }}>AGRESSIVA</div>
            </div>
            {/* Speed overlay */}
            <div style={{ position: 'absolute', top: 20, right: 20, padding: 16, background: SD.bg, border: `2px solid ${SD.primary}` }}>
              <div className="sd-label" style={{ fontSize: 9, color: SD.primary, marginBottom: 4 }}>VELOCIDADE</div>
              <div className="sd-mono" style={{ fontSize: 56, color: SD.text, lineHeight: 1, fontWeight: 700 }}>3.8</div>
              <div className="sd-label" style={{ fontSize: 9, color: SD.textDim, marginTop: 4 }}>KM/H · ESCALA 1:18</div>
            </div>
            {/* WHAM burst */}
            <div style={{ position: 'absolute', bottom: 60, right: 80 }}>
              <div className="sd-burst" style={{
                width: 110, height: 110, background: SD.warning, display: 'grid', placeItems: 'center',
                transform: 'rotate(-6deg)',
              }}>
                <div style={{ textAlign: 'center', color: SD.bg, fontFamily: SD.fontDisplay, fontWeight: 900, lineHeight: 0.95 }}>
                  <div style={{ fontSize: 24 }}>WHAM!</div>
                  <div style={{ fontSize: 11 }}>CURVA FORTE</div>
                  <div style={{ fontSize: 10, marginTop: 2 }}>+0.58 g lat</div>
                </div>
              </div>
            </div>
            {/* Bottom telemetry strip */}
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16,
              display: 'flex', gap: 14,
              background: 'linear-gradient(0deg, rgba(10,10,15,0.95), transparent)',
              borderTop: `1px solid ${SD.border}`,
            }}>
              <MiniStat label="ACEL X" value="+0.42" unit="g" color={SD.primary} />
              <MiniStat label="ACEL Y" value="-0.58" unit="g" color={SD.warning} />
              <MiniStat label="ACEL Z" value="+0.98" unit="g" color={SD.success} />
              <div style={{ flex: 1 }} />
              <MiniStat label="EVENTOS" value="14" color={SD.danger} />
              <MiniStat label="CONSUMO REL" value="-23" unit="%" color={SD.danger} />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Narrative + Comparison */}
      <div style={{ background: SD.surface, borderLeft: `1px solid ${SD.border}`, padding: 20, overflow: 'auto' }}>
        <div className="sd-label" style={{ fontSize: 9, marginBottom: 8 }}>COMPARATIVO</div>
        <div className="sd-display" style={{ fontSize: 18, marginBottom: 14 }}>
          SUAVE <span style={{ color: SD.textMute }}>vs</span> AGRESSIVA
        </div>

        <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
          <CompareRow label="SCORE" smooth="92" aggressive="42" unit="" winner="smooth" />
          <CompareRow label="CONSUMO EST." smooth="13.1" aggressive="9.4" unit="km/L" winner="smooth" />
          <CompareRow label="FREADAS" smooth="0" aggressive="6" unit="" winner="smooth" />
          <CompareRow label="CURVAS FORTES" smooth="1" aggressive="8" unit="" winner="smooth" />
          <CompareRow label="GASTO POR 100 KM" smooth="R$ 45" aggressive="R$ 63" unit="" winner="smooth" />
        </div>

        <div style={{ height: 1, background: SD.border, margin: '12px 0 18px' }} />

        <div className="sd-label" style={{ fontSize: 9, marginBottom: 8, color: SD.primary }}>EXPLICAÇÃO DO MODELO</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: SD.textDim, marginBottom: 12 }}>
          O carrinho demonstra a coleta de telemetria. O modelo aplica o consumo base do perfil cadastrado:
        </div>
        <div style={{
          background: SD.bg, border: `1px solid ${SD.border}`,
          padding: 12, fontFamily: SD.fontMono, fontSize: 10, color: SD.textDim, lineHeight: 1.7,
        }}>
          <span style={{ color: SD.primary }}>consumo</span> = <span style={{ color: SD.text }}>baseKmL</span>
          <br />&nbsp;&nbsp;× fatorVelocidade
          <br />&nbsp;&nbsp;× fatorAceleracao
          <br />&nbsp;&nbsp;× fatorFrenagem
          <br />&nbsp;&nbsp;× <span style={{ color: SD.warning }}>fatorRota</span>
          <br />&nbsp;&nbsp;× <span style={{ color: SD.success }}>fatorCalibracao</span>
        </div>
        <div style={{
          marginTop: 14, padding: 12,
          background: 'rgba(255,176,32,0.08)', border: `1px solid ${SD.warning}`,
          fontSize: 11, color: SD.text, lineHeight: 1.5,
        }}>
          <strong style={{ color: SD.warning, letterSpacing: '0.05em' }}>ⓘ ESTIMATIVA HONESTA</strong>
          <div style={{ marginTop: 4, color: SD.textDim }}>
            Não medimos combustível no tanque. O número exibido é proporcional ao comportamento detectado pelo IMU + GPS.
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span className="sd-label" style={{ fontSize: 9, color: SD.textDim }}>{label}</span>
      <span className="sd-mono" style={{ fontSize: 18, color, fontWeight: 600 }}>
        {value}
        {unit && <span style={{ fontSize: 10, color: SD.textDim, marginLeft: 3 }}>{unit}</span>}
      </span>
    </div>
  );
}

function CompareRow({ label, smooth, aggressive, unit, winner }: { label: string; smooth: string; aggressive: string; unit: string; winner: string }) {
  return (
    <div>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{
          padding: 8,
          background: winner === 'smooth' ? SD.successSoft : SD.surface2,
          border: `1px solid ${winner === 'smooth' ? SD.success : SD.border}`,
        }}>
          <div className="sd-mono" style={{ fontSize: 18, color: winner === 'smooth' ? SD.success : SD.text, fontWeight: 600 }}>
            {smooth}<span style={{ fontSize: 10, color: SD.textDim, marginLeft: 3 }}>{unit}</span>
          </div>
        </div>
        <div style={{ padding: 8, background: SD.dangerSoft, border: `1px solid ${SD.danger}` }}>
          <div className="sd-mono" style={{ fontSize: 18, color: SD.danger, fontWeight: 600 }}>
            {aggressive}<span style={{ fontSize: 10, color: SD.textDim, marginLeft: 3 }}>{unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackView() {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="800" height="500" fill="#0E0E16" />
      {Array.from({ length: 16 }).map((_, i) => (
        <line key={'h' + i} x1="0" y1={i * 32} x2="800" y2={i * 32} stroke="#1A1A26" strokeWidth="1" />
      ))}
      {Array.from({ length: 26 }).map((_, i) => (
        <line key={'v' + i} x1={i * 32} y1="0" x2={i * 32} y2="500" stroke="#1A1A26" strokeWidth="1" />
      ))}
      <path
        d="M 120 250 C 120 120, 280 80, 400 130 C 520 180, 520 320, 640 320 C 760 320, 760 180, 640 180 C 520 180, 520 380, 400 380 C 280 380, 120 380, 120 250 Z"
        fill="none" stroke="#1F1F2D" strokeWidth="56"
      />
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
      <g>
        <circle cx="400" cy="130" r="16" fill={SD.warning} opacity="0.18" />
        <circle cx="400" cy="130" r="6" fill={SD.warning} stroke={SD.bg} strokeWidth="2" />
        <text x="400" y="106" textAnchor="middle" fill={SD.warning} fontSize="9" fontFamily={SD.fontMono}>CURVA</text>
        <circle cx="640" cy="180" r="16" fill={SD.danger} opacity="0.18" />
        <circle cx="640" cy="180" r="6" fill={SD.danger} stroke={SD.bg} strokeWidth="2" />
        <text x="640" y="156" textAnchor="middle" fill={SD.danger} fontSize="9" fontFamily={SD.fontMono}>FREADA</text>
        <circle cx="280" cy="380" r="16" fill={SD.primary} opacity="0.18" />
        <circle cx="280" cy="380" r="6" fill={SD.primary} stroke={SD.bg} strokeWidth="2" />
        <text x="280" y="408" textAnchor="middle" fill={SD.primary} fontSize="9" fontFamily={SD.fontMono}>ACEL</text>
      </g>
      <g transform="translate(540 350) rotate(-25)">
        <circle r="22" fill={SD.primary} opacity="0.18" className="sd-pulse" />
        <rect x="-10" y="-6" width="20" height="12" fill={SD.primary} stroke={SD.bg} strokeWidth="2" />
        <path d="M 14 0 L 4 -3 L 4 3 Z" fill={SD.danger} />
      </g>
      <path d="M 280 380 Q 380 390 540 350" stroke={SD.primary} strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}
