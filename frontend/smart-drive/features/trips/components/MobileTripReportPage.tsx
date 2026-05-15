'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Stat } from '@/features/shared/ui/primitives';
import { MapView, ArcGauge } from '@/features/shared/ui/map-gauges';
import { MobileShell } from '@/features/shell/components/MobileShell';

export function MobileTripReportPage() {
  return (
    <MobileShell active="trips" title="VIAGEM #030">
      <div style={{ padding: '14px 18px 100px', display: 'grid', gap: 16 }}>
        {/* Header */}
        <div>
          <Tag tone="green"><Dot tone="green" size={5} pulse={false} /> ENCERRADA</Tag>
          <div className="sd-display" style={{ fontSize: 22, lineHeight: 1.05, marginTop: 8 }}>
            FORTALEZA →<br />MARACANAÚ
          </div>
          <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, marginTop: 6 }}>
            QUI 06 MAI · 16:42 → 17:38
          </div>
        </div>

        {/* Map */}
        <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, overflow: 'hidden' }}>
          <div style={{ height: 160 }}>
            <MapView width={400} height={160} mini animate={false} />
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: SD.border }}>
          {[
            { l: 'DISTÂNCIA', v: '28.4', u: 'km' },
            { l: 'DURAÇÃO', v: '56:14', u: 'min' },
            { l: 'VEL. MED', v: '31', u: 'km/h' },
            { l: 'VEL. MAX', v: '78', u: 'km/h' },
            { l: 'CONSUMO', v: '11.2', u: 'km/L', a: SD.success },
            { l: 'GASTO', v: 'R$ 15', u: '· 2.54L', a: SD.warning },
          ].map((k, i) => (
            <div key={i} style={{ background: SD.surface, padding: 14 }}>
              <Stat label={k.l} value={k.v} unit={k.u} size="md" accent={k.a} />
            </div>
          ))}
        </div>

        {/* Score card */}
        <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 16 }}>
          <div className="sd-label" style={{ fontSize: 10, marginBottom: 12 }}>SCORE DA VIAGEM</div>
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <ArcGauge value={74} size={200} hint="BOA · PERFIL ECONÔMICO" />
          </div>
          <div style={{ display: 'grid', gap: 6, paddingTop: 12, borderTop: `1px dashed ${SD.border}` }}>
            {[
              { l: 'Aceleração', v: 'OK', t: 'green' as const },
              { l: 'Frenagem · 2 eventos', v: '-6 pts', t: 'red' as const },
              { l: 'Curvas · 3 fortes', v: '-9 pts', t: 'yellow' as const },
              { l: 'Velocidade · 1 pico', v: '-7 pts', t: 'yellow' as const },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                borderBottom: i < 3 ? `1px solid ${SD.border}` : 'none', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12 }}>{r.l}</span>
                <Tag tone={r.t}>{r.v}</Tag>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div>
          <div className="sd-label" style={{ fontSize: 10, marginBottom: 10 }}>EVENTOS · 9</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { t: '16:51', l: 'Freada brusca · -0.71 g', icon: Icon.brake, c: SD.danger },
              { t: '17:03', l: 'Curva forte · +0.62 g', icon: Icon.turn, c: SD.warning },
              { t: '17:11', l: 'Aceleração brusca · +0.58 g', icon: Icon.bolt, c: SD.danger },
              { t: '17:18', l: 'Pico de velocidade · 78 km/h', icon: Icon.speed, c: SD.warning },
            ].map((e, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 12, alignItems: 'center',
                padding: 12, background: SD.surface, border: `1px solid ${SD.border}`,
              }}>
                <div style={{ width: 32, height: 32, border: `1.5px solid ${e.c}`, color: e.c, display: 'grid', placeItems: 'center' }}>
                  {e.icon(14)}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{e.l}</div>
                  <div className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>{e.t}</div>
                </div>
                <span style={{ color: SD.textDim }}>{Icon.arrow(14)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
