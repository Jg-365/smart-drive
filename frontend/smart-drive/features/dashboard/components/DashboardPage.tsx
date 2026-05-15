'use client';

import type React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Stat } from '@/features/shared/ui/primitives';
import { MapView, Speedometer, ArcGauge, Wave, AxisBars } from '@/features/shared/ui/map-gauges';

interface DashboardPageProps {
  speed?: number;
  score?: number;
}

export function DashboardPage({ speed = 47, score = 78 }: DashboardPageProps) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1.8fr 1fr', gridTemplateRows: '1fr auto',
      height: '100%', gap: 1, background: SD.border,
    }}>
      {/* Map */}
      <div style={{ gridColumn: 1, gridRow: '1 / 3', position: 'relative', background: SD.bg }}>
        <MapView width={900} height={760} />
        {/* HUD overlay */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
          <Tag tone="cyan"><Dot tone="cyan" size={6} /> LIVE</Tag>
          <Tag>FORTALEZA · CE</Tag>
          <Tag>BR-116</Tag>
        </div>
        <div style={{ position: 'absolute', top: 16, right: 80, display: 'flex', gap: 6 }}>
          <Btn tone="solid" size="sm" icon={Icon.search(12)}>BUSCAR</Btn>
          <Btn tone="solid" size="sm">SEGUIR VEÍCULO</Btn>
          <Btn tone="solid" size="sm">CAMADAS</Btn>
        </div>
        {/* Floating vehicle info card */}
        <div style={{
          position: 'absolute', left: '38%', top: '54%',
          background: SD.surface, border: `1.5px solid ${SD.primary}`,
          padding: '10px 14px', minWidth: 220,
        }}>
          <div className="sd-label" style={{ fontSize: 9, color: SD.primary, marginBottom: 4 }}>VEÍCULO · onix-lt</div>
          <div className="sd-mono" style={{ fontSize: 11 }}>
            <div>LAT  <span style={{ color: SD.text }}>-3.73192</span></div>
            <div>LNG  <span style={{ color: SD.text }}>-38.52674</span></div>
            <div>SPD  <span style={{ color: SD.text }}>{speed} km/h</span> <span style={{ color: SD.success }}>↗</span></div>
            <div>HDG  <span style={{ color: SD.text }}>112° SE</span></div>
          </div>
        </div>
        {/* Event burst */}
        <div style={{ position: 'absolute', left: '52%', top: '38%' }}>
          <div className="sd-burst" style={{
            width: 78, height: 78, background: SD.danger, display: 'grid', placeItems: 'center',
            transform: 'rotate(-8deg)',
          }}>
            <div style={{ textAlign: 'center', color: SD.bg, fontFamily: SD.fontDisplay, fontWeight: 900, lineHeight: 0.95 }}>
              <div style={{ fontSize: 18 }}>FREADA!</div>
              <div style={{ fontSize: 9 }}>-0.62 g</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right top: metrics */}
      <div style={{
        gridColumn: 2, gridRow: 1, background: SD.bg, padding: 16,
        display: 'grid', gap: 16, gridTemplateRows: 'auto auto 1fr', overflow: 'hidden',
      }}>
        {/* Speedo + score */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 12 }}>
            <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>VELOCIDADE</div>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <Speedometer kmh={speed} size={220} />
            </div>
            <div className="sd-mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: SD.textDim, marginTop: -8 }}>
              <span>MED 38</span><span>MAX 73</span>
            </div>
          </div>
          <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 12 }}>
            <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>SCORE</div>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <ArcGauge value={score} hint={score >= 75 ? 'CONDUÇÃO BOA' : 'MODERADA'} size={200} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: SD.textDim }} className="sd-mono">
              <span>-6 FREADAS</span><span>-9 CURVAS</span><span>-7 VEL</span>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: SD.border, border: `1.5px solid ${SD.border}` }}>
          {[
            { l: 'DISTÂNCIA', v: '14.7', u: 'km' },
            { l: 'TEMPO', v: '23:14', u: 'min' },
            { l: 'CONSUMO EST.', v: '10.8', u: 'km/L', sub: 'CONF. 72%' },
            { l: 'LITROS', v: '1.36', u: 'L', sub: 'R$ 8,03' },
          ].map((k, i) => (
            <div key={i} style={{ background: SD.surface, padding: '12px 14px' }}>
              <Stat label={k.l} value={k.v} unit={k.u} size="md" sub={k.sub} />
            </div>
          ))}
        </div>

        {/* Accelerometer card */}
        <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 14, display: 'grid', gap: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="sd-label" style={{ fontSize: 10 }}>ACELERÔMETRO · 50 Hz</span>
            <Tag tone="green"><Dot tone="green" size={5} /> ESTÁVEL</Tag>
          </div>
          <Wave width={360} height={48} color={SD.primary} fill />
          <AxisBars x={0.12} y={-0.42} z={0.98} width="100%" />
        </div>
      </div>

      {/* Right bottom: events timeline */}
      <div style={{ gridColumn: 2, gridRow: 2, background: SD.bg, padding: '0 16px 16px', overflow: 'hidden' }}>
        <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}` }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${SD.border}`, display: 'flex', justifyContent: 'space-between' }}>
            <span className="sd-display" style={{ fontSize: 13 }}>EVENTOS RECENTES</span>
            <span className="sd-label" style={{ fontSize: 9 }}>ÚLTIMOS 5 MIN</span>
          </div>
          <EventList />
        </div>
      </div>
    </div>
  );
}

function EventList() {
  const events = [
    { t: '17:41:58', type: 'HARD_BRAKE', label: 'Freada brusca', v: '-0.62 g', sev: 'red', icon: Icon.brake },
    { t: '17:40:12', type: 'SHARP_TURN', label: 'Curva forte à direita', v: '0.48 g lat', sev: 'yellow', icon: Icon.turn },
    { t: '17:38:44', type: 'HARD_ACCEL', label: 'Aceleração brusca', v: '+0.51 g', sev: 'red', icon: Icon.bolt },
    { t: '17:35:09', type: 'SPEED_SPIKE', label: 'Pico de velocidade · 73 km/h', v: '+18 km/h', sev: 'yellow', icon: Icon.speed },
  ];

  return (
    <div>
      {events.map((e, i) => (
        <div
          key={i}
          className="sd-hover-row"
          style={{
            display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 12, alignItems: 'center',
            padding: '12px 14px', borderBottom: i < events.length - 1 ? `1px solid ${SD.border}` : 'none',
          }}
        >
          <div style={{
            width: 28, height: 28,
            background: e.sev === 'red' ? SD.dangerSoft : SD.warningSoft,
            border: `1.5px solid ${e.sev === 'red' ? SD.danger : SD.warning}`,
            display: 'grid', placeItems: 'center', color: e.sev === 'red' ? SD.danger : SD.warning,
          }}>
            {e.icon(14)}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{e.label}</div>
            <div className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>{e.t} · {e.type}</div>
          </div>
          <div className="sd-mono" style={{ fontSize: 11, color: e.sev === 'red' ? SD.danger : SD.warning }}>
            {e.v}
          </div>
        </div>
      ))}
    </div>
  );
}
