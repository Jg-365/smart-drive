'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Panel } from '@/features/shared/ui/primitives';

export function VehiclesPage() {
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

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <Panel
            title="ABASTECIMENTOS"
            kicker="CALIBRAÇÃO COM DADOS REAIS"
            tools={<Btn tone="outline" size="sm" icon={Icon.plus(12)}>NOVO</Btn>}
          >
            <div style={{
              display: 'grid', gridTemplateColumns: '88px 1fr 1fr 1fr 1fr',
              padding: '8px 0', borderBottom: `1px solid ${SD.border}`,
            }} className="sd-label">
              {['DATA', 'HODÔMETRO', 'LITROS', 'VALOR', 'KM/L REAL'].map((h) => (
                <span key={h} style={{ fontSize: 9 }}>{h}</span>
              ))}
            </div>
            {[
              ['02/05', '38.412', '42.1 L', 'R$ 248,00', '12.6'],
              ['18/04', '37.892', '38.4 L', 'R$ 224,16', '12.2'],
              ['04/04', '37.413', '40.8 L', 'R$ 238,68', '12.1'],
              ['21/03', '36.912', '36.2 L', 'R$ 210,76', '12.4'],
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'grid', gridTemplateColumns: '88px 1fr 1fr 1fr 1fr',
                  padding: '10px 0', borderBottom: i < 3 ? `1px solid ${SD.border}` : 'none', fontSize: 12,
                }}
                className="sd-mono"
              >
                <span style={{ color: SD.textDim }}>{r[0]}</span>
                <span>{r[1]}</span>
                <span>{r[2]}</span>
                <span>{r[3]}</span>
                <span style={{ color: SD.success }}>{r[4]}</span>
              </div>
            ))}
          </Panel>

          <Panel title="CALIBRAÇÃO" kicker="MODELO ADAPTATIVO" accent={SD.success}>
            <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, lineHeight: 1.6, marginBottom: 16 }}>
              4 abastecimentos coletados desde o pareamento. O sistema ajustou o fator de calibração com base no consumo real.
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <KV label="Consumo base cadastrado" v="12.4 km/L" />
              <KV label="Consumo real médio (4)" v="12.33 km/L" />
              <KV label="Desvio" v="-0.56%" tone={SD.success} />
              <KV label="Fator de calibração" v="0.994" tone={SD.primary} />
              <KV label="Última atualização" v="02/05 · 14:22" />
            </div>
            <div style={{ height: 1, background: SD.border, margin: '16px 0' }} />
            <div className="sd-label" style={{ fontSize: 9, marginBottom: 6, color: SD.success }}>CONFIANÇA DO MODELO</div>
            <div style={{ height: 8, background: SD.surface2, border: `1px solid ${SD.border}` }}>
              <div style={{ height: '100%', width: '78%', background: SD.success }} />
            </div>
            <div className="sd-mono" style={{ fontSize: 10, color: SD.textDim, marginTop: 4 }}>78% · ALTA</div>
          </Panel>
        </div>
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

function KV({ label, v, tone }: { label: string; v: string; tone?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: `1px dashed ${SD.border}`,
    }}>
      <span style={{ fontSize: 12, color: SD.textDim }}>{label}</span>
      <span className="sd-mono" style={{ fontSize: 12, color: tone || SD.text, fontWeight: 600 }}>{v}</span>
    </div>
  );
}
