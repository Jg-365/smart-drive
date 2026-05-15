'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Stat } from '@/features/shared/ui/primitives';
import { MapView } from '@/features/shared/ui/map-gauges';
import { MobileShell } from '@/features/shell/components/MobileShell';

export function MapPage() {
  return (
    <MobileShell active="map" hideBars>
      <div style={{ position: 'relative', height: '100%' }}>
        <MapView width={400} height={760} />

        {/* Top overlay */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 8 }}>
          <Btn tone="solid" size="sm" icon={Icon.back(12)} style={{ background: SD.bg }}>VOLTAR</Btn>
          <div style={{ flex: 1 }} />
          <Btn tone="solid" size="sm" style={{ background: SD.bg }}>CAMADAS</Btn>
        </div>

        {/* Live tags */}
        <div style={{ position: 'absolute', top: 60, left: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Tag tone="red"><Dot tone="red" size={5} /> AO VIVO</Tag>
          <Tag tone="cyan">SEGUIR VEÍCULO</Tag>
        </div>

        {/* Zoom controls */}
        <div style={{ position: 'absolute', right: 12, top: '40%', display: 'flex', flexDirection: 'column' }}>
          <div className="sd-btn" style={{
            width: 38, height: 38, background: SD.bg, border: `1.5px solid ${SD.borderHi}`,
            display: 'grid', placeItems: 'center', color: SD.text, fontSize: 20,
          }}>+</div>
          <div className="sd-btn" style={{
            width: 38, height: 38, background: SD.bg, border: `1.5px solid ${SD.borderHi}`,
            borderTop: 'none', display: 'grid', placeItems: 'center', color: SD.text, fontSize: 20,
          }}>−</div>
          <div className="sd-btn" style={{
            width: 38, height: 38, background: SD.bg, border: `1.5px solid ${SD.borderHi}`,
            borderTop: 'none', display: 'grid', placeItems: 'center', color: SD.primary, marginTop: 6,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="2.5" fill={SD.primary} />
              <circle cx="8" cy="8" r="5.5" fill="none" stroke={SD.primary} strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Bottom card */}
        <div style={{
          position: 'absolute', left: 12, right: 12, bottom: 18,
          background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 14,
        }}>
          <div style={{ width: 40, height: 4, background: SD.borderBright, margin: '-4px auto 12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div className="sd-label" style={{ fontSize: 9, color: SD.primary }}>VEÍCULO</div>
              <div className="sd-display" style={{ fontSize: 14 }}>ONIX LT · 47 KM/H</div>
            </div>
            <Tag tone="green">ON ROUTE</Tag>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, paddingTop: 10, borderTop: `1px dashed ${SD.border}` }}>
            <Stat label="DIST" value="14.7" unit="km" size="sm" />
            <Stat label="TEMPO" value="23:14" size="sm" />
            <Stat label="EVENTOS" value="4" size="sm" accent={SD.warning} />
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
