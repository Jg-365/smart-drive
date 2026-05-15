'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Stat } from '@/features/shared/ui/primitives';
import { Speedometer, MapView, Wave, AxisBars } from '@/features/shared/ui/map-gauges';
import { MobileShell } from '@/features/shell/components/MobileShell';

interface MobileLivePageProps {
  speed?: number;
}

export function MobileLivePage({ speed = 47 }: MobileLivePageProps) {
  return (
    <MobileShell active="live" scroll>
      <div style={{ padding: '8px 18px 100px', display: 'grid', gap: 14 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Tag tone="red"><Dot tone="red" size={5} /> AO VIVO · TRIP-2026-031</Tag>
            <div className="sd-display" style={{ fontSize: 14, marginTop: 4 }}>23:14 · 14.7 KM</div>
          </div>
          <Btn tone="ghost" size="sm" icon={Icon.stop(10)}>PARAR</Btn>
        </div>

        {/* Hero speedometer */}
        <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle at 50% 110%, #00E5FF, transparent 60%)' }} />
          <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
            <Speedometer kmh={speed} size={240} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: `1px dashed ${SD.border}`, paddingTop: 12, marginTop: -10 }}>
            <Stat label="MED" value="38" unit="km/h" size="sm" />
            <Stat label="MAX" value="73" unit="km/h" size="sm" />
            <Stat label="LIMITE" value="60" unit="km/h" size="sm" accent={SD.warning} />
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: SD.border }}>
          <div style={{ background: SD.surface, padding: 14 }}>
            <Stat label="SCORE" value="78" size="md" accent={SD.success} sub="BOA" />
          </div>
          <div style={{ background: SD.surface, padding: 14 }}>
            <Stat label="CONSUMO EST." value="10.8" unit="km/L" size="md" sub="CONF. 72%" />
          </div>
          <div style={{ background: SD.surface, padding: 14 }}>
            <Stat label="GASTO" value="R$ 8,03" size="md" sub="1.36 L" />
          </div>
          <div style={{ background: SD.surface, padding: 14 }}>
            <Stat label="EVENTOS" value="4" size="md" accent={SD.warning} sub="2 freadas · 1 curva" />
          </div>
        </div>

        {/* Mini map */}
        <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, overflow: 'hidden' }}>
          <div style={{ height: 160 }}>
            <MapView width={400} height={160} mini />
          </div>
          <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${SD.border}` }}>
            <span className="sd-mono" style={{ fontSize: 11 }}>-3.7319 / -38.5267</span>
            <Btn tone="outline" size="sm">EXPANDIR</Btn>
          </div>
        </div>

        {/* Accel card */}
        <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="sd-label" style={{ fontSize: 10 }}>ACELERÔMETRO</span>
            <Tag tone="green"><Dot tone="green" size={5} /> 50 HZ</Tag>
          </div>
          <Wave width={340} height={48} fill color={SD.primary} />
          <div style={{ marginTop: 10 }}>
            <AxisBars x={0.12} y={-0.42} z={0.98} width="100%" />
          </div>
        </div>

        {/* Event burst */}
        <div style={{ position: 'relative', background: SD.surface, border: `1.5px solid ${SD.danger}`, padding: 14 }}>
          <Tag tone="red" style={{ marginBottom: 8 }}>EVENTO · 17:41:58</Tag>
          <div className="sd-display" style={{ fontSize: 22, lineHeight: 1 }}>FREADA BRUSCA!</div>
          <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, marginTop: 6 }}>
            Desaceleração de -0.62 g · Av. Bezerra de Menezes · score -3
          </div>
          <div style={{ position: 'absolute', top: -10, right: -10 }}>
            <div className="sd-burst" style={{
              width: 56, height: 56, background: SD.danger, display: 'grid', placeItems: 'center',
              transform: 'rotate(8deg)',
            }}>
              <div style={{ color: SD.bg, fontFamily: SD.fontDisplay, fontWeight: 900, fontSize: 11 }}>POW!</div>
            </div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
