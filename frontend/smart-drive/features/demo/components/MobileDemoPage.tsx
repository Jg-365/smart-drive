'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn } from '@/features/shared/ui/primitives';
import { MobileShell } from '@/features/shell/components/MobileShell';

function TrackViewMobile() {
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
      <g transform="translate(540 350) rotate(-25)">
        <circle r="22" fill={SD.primary} opacity="0.18" className="sd-pulse" />
        <rect x="-10" y="-6" width="20" height="12" fill={SD.primary} stroke={SD.bg} strokeWidth="2" />
        <path d="M 14 0 L 4 -3 L 4 3 Z" fill={SD.danger} />
      </g>
    </svg>
  );
}

export function MobileDemoPage() {
  return (
    <MobileShell active="menu" hideBars>
      <div style={{ height: '100%', position: 'relative', background: SD.bg, overflow: 'auto' }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${SD.border}`,
        }}>
          <span className="sd-btn" style={{ color: SD.textDim }}>{Icon.back(18)}</span>
          <Tag tone="cyan"><Dot tone="cyan" size={5} /> EXPOIOT</Tag>
          <span className="sd-btn" style={{ color: SD.textDim }}>{Icon.reset(18)}</span>
        </div>

        <div style={{ padding: 18, display: 'grid', gap: 14 }}>
          <div>
            <div className="sd-label" style={{ fontSize: 9, color: SD.primary }}>MODO APRESENTAÇÃO</div>
            <div className="sd-display" style={{ fontSize: 22, lineHeight: 1 }}>CARRINHO RC<br />NA PISTA</div>
          </div>

          {/* Big readouts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: SD.border, border: `2px solid ${SD.danger}` }}>
            <div style={{ background: SD.bg, padding: 16 }}>
              <div className="sd-label" style={{ fontSize: 9, color: SD.danger, marginBottom: 4 }}>SCORE</div>
              <div className="sd-mono" style={{ fontSize: 56, color: SD.danger, lineHeight: 1, fontWeight: 700 }}>42</div>
              <div className="sd-label" style={{ fontSize: 9, color: SD.danger, marginTop: 4 }}>AGRESSIVA</div>
            </div>
            <div style={{ background: SD.bg, padding: 16 }}>
              <div className="sd-label" style={{ fontSize: 9, color: SD.primary, marginBottom: 4 }}>VEL.</div>
              <div className="sd-mono" style={{ fontSize: 56, color: SD.text, lineHeight: 1, fontWeight: 700 }}>3.8</div>
              <div className="sd-label" style={{ fontSize: 9, color: SD.textDim, marginTop: 4 }}>KM/H · 1:18</div>
            </div>
          </div>

          {/* Track */}
          <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, height: 200, position: 'relative', overflow: 'hidden' }}>
            <TrackViewMobile />
            <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
              <div className="sd-burst" style={{
                width: 64, height: 64, background: SD.warning, display: 'grid', placeItems: 'center',
                transform: 'rotate(-6deg)',
              }}>
                <div style={{ color: SD.bg, fontFamily: SD.fontDisplay, fontWeight: 900, fontSize: 12, textAlign: 'center', lineHeight: 1 }}>
                  WHAM!<br /><span style={{ fontSize: 8 }}>CURVA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile selector */}
          <div className="sd-label" style={{ fontSize: 9 }}>PERFIL DE CONDUÇÃO</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { l: 'SUAVE', c: SD.success, active: false },
              { l: 'NORMAL', c: SD.primary, active: false },
              { l: 'AGRESSIVA', c: SD.danger, active: true },
            ].map((m, i) => (
              <div
                key={i}
                className="sd-btn"
                style={{
                  padding: '12px 8px', textAlign: 'center',
                  border: `1.5px solid ${m.active ? m.c : SD.border}`,
                  background: m.active ? `${m.c}15` : SD.surface,
                }}
              >
                <span className="sd-label" style={{ fontSize: 10, color: m.active ? m.c : SD.text }}>{m.l}</span>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <Btn tone="primary" size="lg" full icon={Icon.play(14)}>PAUSAR DEMO</Btn>
            <Btn tone="ghost" size="lg" full icon={Icon.reset(12)}>RESET</Btn>
          </div>

          <div style={{ padding: 12, background: 'rgba(255,176,32,0.08)', border: `1px solid ${SD.warning}`, fontSize: 11, color: SD.textDim }}>
            <strong style={{ color: SD.warning }}>ⓘ</strong> O carrinho coleta telemetria real. O consumo exibido é proporcional ao comportamento, usando o perfil do veículo simulado.
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
