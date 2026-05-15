'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Panel } from '@/features/shared/ui/primitives';

export function DevicesPage() {
  return (
    <div style={{
      height: '100%', overflow: 'auto', background: SD.bg, padding: 24,
      display: 'grid', gap: 16, gridTemplateColumns: '320px 1fr', alignContent: 'start',
    }}>
      {/* LEFT: Vehicle list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="sd-display" style={{ fontSize: 18 }}>VEÍCULOS</span>
          <Btn tone="outline" size="sm" icon={Icon.plus(12)}>NOVO</Btn>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            { brand: 'CHEVROLET', model: 'Onix LT 1.0', year: '2021', cons: '12.4', tank: '44', dev: 'esp32-demo-001', active: true },
            { brand: 'FIAT', model: 'Strada Endurance', year: '2023', cons: '10.8', tank: '55', dev: '—', active: false },
            { brand: 'HONDA', model: 'CG 160 Fan', year: '2022', cons: '38.5', tank: '12', dev: '—', active: false },
          ].map((v, i) => (
            <div
              key={i}
              className="sd-btn"
              style={{
                padding: 14,
                border: `1.5px solid ${v.active ? SD.primary : SD.border}`,
                background: v.active ? 'rgba(0,229,255,0.05)' : SD.surface,
                display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12,
              }}
            >
              <div style={{
                width: 36, height: 36, background: SD.surface2, border: `1px solid ${SD.border}`,
                display: 'grid', placeItems: 'center', color: v.active ? SD.primary : SD.textDim,
              }}>
                {Icon.car(18)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span className="sd-label" style={{ fontSize: 9, color: SD.textDim }}>{v.brand}</span>
                  {v.active && <Tag tone="cyan">ATIVO</Tag>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{v.model}</div>
                <div className="sd-mono" style={{ fontSize: 10, color: SD.textDim, display: 'flex', gap: 10 }}>
                  <span>{v.year}</span>
                  <span>{v.cons} km/L</span>
                  <span>{v.tank}L</span>
                </div>
                <div className="sd-mono" style={{ fontSize: 9, color: v.dev === '—' ? SD.textMute : SD.success, marginTop: 4 }}>
                  ⓘ {v.dev}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: SD.border, margin: '20px 0' }} />

        <div className="sd-label" style={{ fontSize: 9, marginBottom: 10 }}>DISPOSITIVOS PAREADOS</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            { code: 'esp32-demo-001', status: 'online', fw: '0.4.1', last: 'agora' },
            { code: 'esp32-demo-002', status: 'offline', fw: '0.4.1', last: 'há 2h' },
          ].map((d, i) => (
            <div
              key={i}
              style={{
                padding: 10, background: SD.surface, border: `1px solid ${SD.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div className="sd-mono" style={{ fontSize: 11, color: SD.text }}>{d.code}</div>
                <div className="sd-mono" style={{ fontSize: 9, color: SD.textDim }}>FRT {d.fw} · {d.last}</div>
              </div>
              <Tag tone={d.status === 'online' ? 'green' : 'neutral'}>
                <Dot tone={d.status === 'online' ? 'green' : 'gray'} size={5} pulse={d.status === 'online'} />
                {d.status === 'online' ? 'ONLINE' : 'OFFLINE'}
              </Tag>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Detail form */}
      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <Panel
          title="ONIX LT 1.0 · 2021"
          kicker="VEÍCULO ATIVO"
          accent={SD.primary}
          tools={
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn tone="ghost" size="sm">DUPLICAR</Btn>
              <Btn tone="ghost" size="sm" style={{ color: SD.danger, borderColor: 'rgba(255,51,68,0.4)' }}>EXCLUIR</Btn>
            </div>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <Field label="MARCA" value="Chevrolet" />
            <Field label="MODELO" value="Onix LT" />
            <Field label="ANO" value="2021" />
            <Field label="MOTOR" value="1.0 12V" />
            <Field label="COMBUSTÍVEL" value="Flex (E)" />
            <Field label="PESO (kg)" value="1.072" />
            <Field label="CONSUMO URBANO" value="12.4 km/L" accent={SD.primary} />
            <Field label="CONSUMO RODOVIÁRIO" value="14.1 km/L" accent={SD.primary} />
            <Field label="TANQUE" value="44 L" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
      <div style={{
        padding: '10px 12px', background: SD.surface2, border: `1px solid ${SD.border}`,
        color: accent || SD.text, fontSize: 13, fontWeight: 500,
      }} className={accent ? 'sd-mono' : ''}>
        {value}
      </div>
    </div>
  );
}
