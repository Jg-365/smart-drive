'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Stat, Panel } from '@/features/shared/ui/primitives';
import { MapView, ArcGauge, Wave } from '@/features/shared/ui/map-gauges';

export function TripReportPage() {
  const speedPts = Array.from({ length: 80 }).map((_, i) =>
    Math.sin(i * 0.18) * 0.5 + Math.sin(i * 0.06) * 0.4
  );
  const latPts = Array.from({ length: 80 }).map((_, i) =>
    Math.sin(i * 0.35) * 0.55
  );
  const longPts = Array.from({ length: 80 }).map((_, i) =>
    Math.cos(i * 0.22) * 0.5 + Math.sin(i * 0.08) * 0.3
  );

  return (
    <div style={{ height: '100%', overflow: 'auto', background: SD.bg, padding: 24, display: 'grid', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="sd-label" style={{ fontSize: 10, color: SD.primary }}>RELATÓRIO DE VIAGEM</span>
            <Tag tone="green"><Dot tone="green" size={5} pulse={false} /> ENCERRADA</Tag>
            <Tag>TRIP-2026-030</Tag>
          </div>
          <div className="sd-display" style={{ fontSize: 32, lineHeight: 1 }}>
            FORTALEZA → MARACANAÚ
          </div>
          <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, marginTop: 6 }}>
            QUI · 06 MAI · 16:42 → 17:38  ·  56 MIN 14 S  ·  ONIX LT 1.0
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn tone="ghost" size="md">EXPORTAR CSV</Btn>
          <Btn tone="ghost" size="md">COMPARTILHAR</Btn>
          <Btn tone="outline" size="md">VOLTAR</Btn>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1, background: SD.border, border: `1.5px solid ${SD.border}` }}>
        {[
          { l: 'DISTÂNCIA', v: '28.4', u: 'km' },
          { l: 'DURAÇÃO', v: '56:14', u: 'min' },
          { l: 'VEL. MÉDIA', v: '31', u: 'km/h' },
          { l: 'VEL. MAX', v: '78', u: 'km/h' },
          { l: 'CONSUMO EST.', v: '11.2', u: 'km/L', accent: SD.success, sub: 'CONF. 78%' },
          { l: 'GASTO EST.', v: 'R$ 14,98', u: '', accent: SD.warning, sub: '2.54 L' },
        ].map((k, i) => (
          <div key={i} style={{ background: SD.surface, padding: 18 }}>
            <Stat label={k.l} value={k.v} unit={k.u} accent={k.accent} sub={k.sub} size="lg" />
          </div>
        ))}
      </div>

      {/* Score + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>
        <Panel title="SCORE DA VIAGEM" kicker="0–100" accent={SD.success}>
          <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0 16px' }}>
            <ArcGauge value={74} size={240} hint="BOA · 75% PERFIL ECONÔMICO" />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { l: 'Aceleração suave', v: 'OK', tone: 'green' as const, d: '+0 pts' },
              { l: 'Frenagem', v: '2 eventos', tone: 'red' as const, d: '-6 pts' },
              { l: 'Curvas', v: '3 fortes', tone: 'yellow' as const, d: '-9 pts' },
              { l: 'Velocidade', v: '1 pico', tone: 'yellow' as const, d: '-7 pts' },
              { l: 'Estabilidade', v: 'Estável', tone: 'green' as const, d: '-4 pts' },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10,
                padding: '8px 0', borderBottom: `1px dashed ${SD.border}`, alignItems: 'center',
              }}>
                <span style={{ fontSize: 12 }}>{r.l}</span>
                <Tag tone={r.tone}>{r.v}</Tag>
                <span className="sd-mono" style={{ fontSize: 11, color: SD.textDim, minWidth: 50, textAlign: 'right' }}>{r.d}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="TRAJETO"
          kicker="POLYLINE · 1.842 PTS"
          tools={
            <div style={{ display: 'flex', gap: 6 }}>
              <Tag tone="cyan"><Dot tone="cyan" size={5} pulse={false} /> Rota</Tag>
              <Tag tone="red"><Dot tone="red" size={5} pulse={false} /> Freada</Tag>
              <Tag tone="yellow"><Dot tone="yellow" size={5} pulse={false} /> Curva</Tag>
            </div>
          }
          padding={0}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ height: 360 }}>
            <MapView width={900} height={360} animate={false} />
          </div>
        </Panel>
      </div>

      {/* Charts + Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <Panel title="VELOCIDADE & ACELERAÇÃO" kicker="LINHA DO TEMPO">
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="sd-label" style={{ fontSize: 9, color: SD.primary }}>SPEED km/h</span>
                <span className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>0 ··· 80</span>
              </div>
              <Wave width={620} height={64} color={SD.primary} fill points={speedPts} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="sd-label" style={{ fontSize: 9, color: SD.warning }}>ACEL LATERAL g</span>
                <span className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>-1 ··· +1</span>
              </div>
              <Wave width={620} height={64} color={SD.warning} fill points={latPts} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="sd-label" style={{ fontSize: 9, color: SD.danger }}>ACEL LONGITUDINAL g</span>
                <span className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>-1 ··· +1</span>
              </div>
              <Wave width={620} height={64} color={SD.danger} fill points={longPts} />
            </div>
          </div>
        </Panel>

        <Panel title="RECOMENDAÇÕES" kicker="MODELO v0.4 · EXPLICÁVEL" accent={SD.warning}>
          <div style={{ display: 'grid', gap: 12 }}>
            <Recommendation
              icon={Icon.brake}
              tone="red"
              title="Reduza freadas bruscas em rotatórias"
              body="Detectamos 2 freadas com desaceleração > 0,6 g em curvas. Antecipar a redução economiza ~7% de combustível."
            />
            <Recommendation
              icon={Icon.turn}
              tone="yellow"
              title="Curvas mais suaves"
              body="3 curvas com aceleração lateral acima do limiar. Reduzir velocidade na aproximação preserva pneus e estabilidade."
            />
            <Recommendation
              icon={Icon.fuel}
              tone="green"
              title="Mantenha o regime entre 60–80 km/h"
              body="Você passou 64% do tempo na faixa ótima de consumo do Onix LT. Continue assim."
            />
          </div>
        </Panel>
      </div>

      {/* Events table */}
      <Panel title="EVENTOS DETECTADOS" kicker="9 NO TOTAL" tools={<Tag>FILTRAR POR TIPO</Tag>} padding={0}>
        <div style={{
          display: 'grid', gridTemplateColumns: '90px 160px 1fr 110px 120px 80px',
          padding: '10px 16px', borderBottom: `1px solid ${SD.border}`, background: SD.surface2,
        }} className="sd-label">
          {['HORA', 'TIPO', 'DESCRIÇÃO', 'VALOR', 'LOCAL', 'SEV.'].map((h) => (
            <span key={h} style={{ fontSize: 9 }}>{h}</span>
          ))}
        </div>
        {[
          ['16:51:02', 'HARD_BRAKE', 'Freada antes do semáforo Av. Bezerra de Menezes', '-0.71 g', '-3.7314 / -38.5301', 'ALTA'],
          ['17:03:18', 'SHARP_TURN', 'Curva forte à direita · Av. Heráclito Graça', '+0.62 g', '-3.7388 / -38.5278', 'MÉDIA'],
          ['17:11:46', 'HARD_ACCEL', 'Aceleração ao retomar via', '+0.58 g', '-3.7421 / -38.5197', 'MÉDIA'],
          ['17:18:31', 'SPEED_SPIKE', 'Pico breve a 78 km/h em via 50', '+28 km/h', '-3.7468 / -38.5102', 'MÉDIA'],
          ['17:24:09', 'SHARP_TURN', 'Curva forte à esquerda · Rotatória', '+0.49 g', '-3.7501 / -38.5044', 'BAIXA'],
        ].map((r, i) => (
          <div
            key={i}
            className="sd-hover-row"
            style={{
              display: 'grid', gridTemplateColumns: '90px 160px 1fr 110px 120px 80px',
              padding: '10px 16px', borderBottom: `1px solid ${SD.border}`, alignItems: 'center', fontSize: 12,
            }}
          >
            <span className="sd-mono" style={{ color: SD.textDim }}>{r[0]}</span>
            <Tag tone={r[1].includes('BRAKE') || r[1].includes('IMPACT') ? 'red' : r[1].includes('TURN') ? 'yellow' : 'cyan'}>
              {r[1]}
            </Tag>
            <span>{r[2]}</span>
            <span className="sd-mono">{r[3]}</span>
            <span className="sd-mono" style={{ color: SD.textDim, fontSize: 10 }}>{r[4]}</span>
            <Tag tone={r[5] === 'ALTA' ? 'red' : r[5] === 'MÉDIA' ? 'yellow' : 'neutral'}>{r[5]}</Tag>
          </div>
        ))}
      </Panel>

      <div style={{ display: 'flex', gap: 8, padding: '4px 0 24px', color: SD.textMute, fontSize: 11 }} className="sd-mono">
        ⓘ Consumo é estimativa adaptativa baseada no perfil do veículo e no comportamento detectado — não é medição direta no tanque.
      </div>
    </div>
  );
}

function Recommendation({
  icon,
  title,
  body,
  tone,
}: {
  icon: (s?: number, c?: string) => React.ReactElement;
  title: string;
  body: string;
  tone: 'red' | 'yellow' | 'green';
}) {
  const c = tone === 'red' ? SD.danger : tone === 'yellow' ? SD.warning : SD.success;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '32px 1fr', gap: 12,
      padding: 10, border: `1px solid ${SD.border}`, background: SD.surface2,
    }}>
      <div style={{
        width: 32, height: 32, background: SD.bg, border: `1.5px solid ${c}`, color: c,
        display: 'grid', placeItems: 'center',
      }}>
        {icon(16)}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 11, color: SD.textDim, lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}
