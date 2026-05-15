'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Stat } from '@/features/shared/ui/primitives';
import { MapView } from '@/features/shared/ui/map-gauges';
import { MobileShell } from '@/features/shell/components/MobileShell';

export function MobileHomePage() {
  return (
    <MobileShell active="home">
      <div style={{ padding: '20px 18px 100px', display: 'grid', gap: 18 }}>
        {/* Greeting */}
        <div>
          <div className="sd-label" style={{ fontSize: 9, color: SD.textDim }}>OLÁ,</div>
          <div className="sd-display" style={{ fontSize: 30, lineHeight: 1 }}>LUCAS.</div>
          <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, marginTop: 6 }}>
            7 viagens · 168 km · esta semana
          </div>
        </div>

        {/* CTA card */}
        <div style={{
          background: SD.surface, border: `1.5px solid ${SD.primary}`,
          padding: 16, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20, width: 100, height: 100,
            background: 'radial-gradient(circle, rgba(0,229,255,0.18), transparent 70%)',
          }} />
          <Tag tone="cyan" style={{ marginBottom: 10 }}><Dot tone="cyan" size={5} /> DISPOSITIVO ONLINE</Tag>
          <div className="sd-display" style={{ fontSize: 22, lineHeight: 1.05, marginBottom: 4 }}>PRONTO PARA RODAR?</div>
          <div style={{ fontSize: 12, color: SD.textDim, marginBottom: 14 }}>esp32-demo-001 · Onix LT 1.0</div>
          <Btn tone="primary" size="lg" full icon={Icon.play(14)}>INICIAR VIAGEM</Btn>
        </div>

        {/* Last trip */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="sd-label" style={{ fontSize: 10 }}>ÚLTIMA VIAGEM</span>
            <span className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>HÁ 2 H</span>
          </div>
          <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, overflow: 'hidden' }}>
            <div style={{ height: 120, position: 'relative' }}>
              <MapView width={400} height={120} mini animate={false} />
            </div>
            <div style={{ padding: 14, display: 'grid', gap: 10 }}>
              <div className="sd-display" style={{ fontSize: 16 }}>FORTALEZA → MARACANAÚ</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                <Stat label="DIST" value="28.4" unit="km" size="sm" />
                <Stat label="SCORE" value="74" size="sm" accent={SD.success} />
                <Stat label="EST." value="11.2" unit="km/L" size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Weekly stats */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="sd-label" style={{ fontSize: 10 }}>SEMANA · SEG → DOM</span>
            <span className="sd-mono" style={{ fontSize: 10, color: SD.success }}>+8% vs anterior</span>
          </div>
          <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100, marginBottom: 8 }}>
              {[68, 72, 81, 64, 78, 88, 74].map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    height: `${v}%`, width: '100%',
                    background: v >= 75 ? SD.success : v >= 60 ? SD.warning : SD.danger,
                    opacity: 0.85,
                  }} />
                  <span className="sd-mono" style={{ fontSize: 8, color: SD.textDim }}>
                    {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                  </span>
                </div>
              ))}
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10,
              paddingTop: 12, borderTop: `1px dashed ${SD.border}`,
            }}>
              <Stat label="SCORE MED" value="75" size="sm" accent={SD.success} />
              <Stat label="GASTO EST." value="R$ 89" size="sm" />
              <Stat label="EVENTOS" value="14" size="sm" accent={SD.warning} />
            </div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
