'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Btn, Stat } from '@/features/shared/ui/primitives';
import { MobileShell } from '@/features/shell/components/MobileShell';
import { BrandLogo } from '@/features/shared/ui/BrandLogo';
import { useAuthUser } from '@/features/shared/auth';
import { useTrips } from '@/features/trips/hooks';
import { TripStatus, type Trip } from '@/features/shared/types';

type MobileTab = 'home' | 'live' | 'map' | 'trips' | 'menu';

/** Primeiro nome do usuário em caixa alta, ou um fallback neutro. */
function firstName(name?: string): string {
  const first = name?.trim().split(/\s+/)[0]
  return (first || 'Motorista').toUpperCase()
}

/** Tempo relativo curto a partir de um ISO ("agora", "há 12 min", "há 3 h"…). */
function relativeFromNow(iso?: string): string {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) return '—'
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  return `há ${Math.floor(h / 24)} d`
}

function scoreColor(v: number): string {
  if (v >= 75) return SD.success
  if (v >= 60) return SD.warning
  return SD.danger
}

export function MobileHomePage({
  onNavigate,
  onSettings,
}: {
  onNavigate?: (tab: MobileTab) => void
  onSettings?: () => void
}) {
  const user = useAuthUser();
  const { data: trips, isLoading, isError } = useTrips();

  // Viagens encerradas, mais recentes primeiro (base honesta para os cards).
  const finished: Trip[] = (trips ?? [])
    .filter((t) => t.status === TripStatus.FINISHED)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  const last = finished[0];
  // Até 7 viagens recentes em ordem cronológica, para o gráfico de scores real.
  const recent = finished.slice(0, 7).reverse();
  const avgScore = recent.length
    ? Math.round(recent.reduce((s, t) => s + t.drivingScore, 0) / recent.length)
    : 0;
  const totalKm = recent.reduce((s, t) => s + t.distanceKm, 0);

  return (
    <MobileShell active="home">
      <div style={{ padding: '20px 18px 100px', display: 'grid', gap: 18 }}>
        {/* Greeting */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="sd-label" style={{ fontSize: 9, color: SD.textDim }}>OLÁ,</div>
            <div className="sd-display" style={{ fontSize: 30, lineHeight: 1 }}>{firstName(user?.name)}.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Marca oficial conforme o tema (branca no dark, completa no light). */}
            <BrandLogo height={30} />
            <button
              type="button"
              aria-label="Configurações"
              className="sd-btn"
              onClick={onSettings}
              style={{
                background: 'transparent', border: `1px solid ${SD.border}`,
                color: SD.textDim, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                // área de toque mínima de 44x44 (mobile-first, JOA-RNF-03).
                minWidth: 44, minHeight: 44,
              }}
            >
              {Icon.gear(16)}
            </button>
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
          <Tag tone="cyan" style={{ marginBottom: 10 }}>COMEÇAR</Tag>
          <div className="sd-display" style={{ fontSize: 22, lineHeight: 1.05, marginBottom: 4 }}>PRONTO PARA RODAR?</div>
          <div style={{ fontSize: 12, color: SD.textDim, marginBottom: 14 }}>Inicie a demo ExpoIOT ou uma viagem real.</div>
          <Btn tone="primary" size="lg" full icon={Icon.play(14)} onClick={() => onNavigate?.('menu')}>INICIAR VIAGEM</Btn>
        </div>

        {/* Last trip (dado real) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="sd-label" style={{ fontSize: 10 }}>ÚLTIMA VIAGEM</span>
            {last && (
              <span className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>
                {relativeFromNow(last.endedAt ?? last.startedAt)}
              </span>
            )}
          </div>
          <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 14 }}>
            {isLoading ? (
              <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim }}>Carregando…</div>
            ) : isError ? (
              <div className="sd-mono" style={{ fontSize: 12, color: SD.danger }}>
                Não foi possível carregar as viagens.
              </div>
            ) : !last ? (
              <div className="sd-mono" style={{ fontSize: 12, color: SD.textMute }}>
                Nenhuma viagem encerrada ainda. Inicie uma para ver o resumo aqui.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="sd-display" style={{ fontSize: 14 }}>
                  {new Date(last.startedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  <Stat label="DIST" value={last.distanceKm.toFixed(1)} unit="km" size="sm" />
                  <Stat label="SCORE" value={last.drivingScore} size="sm" accent={scoreColor(last.drivingScore)} />
                  <Stat label="EST." value={last.estimatedConsumptionKmL.toFixed(1)} unit="km/L" size="sm" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent trips scores (dado real) */}
        {recent.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="sd-label" style={{ fontSize: 10 }}>SCORE · ÚLTIMAS VIAGENS</span>
              <span className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>{recent.length}</span>
            </div>
            <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100, marginBottom: 8 }}>
                {recent.map((t) => (
                  <div key={t.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      height: `${Math.max(2, Math.min(100, t.drivingScore))}%`, width: '100%',
                      background: scoreColor(t.drivingScore), opacity: 0.85,
                    }} />
                    <span className="sd-mono" style={{ fontSize: 8, color: SD.textDim }}>
                      {new Date(t.startedAt).toLocaleDateString('pt-BR', { day: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10,
                paddingTop: 12, borderTop: `1px dashed ${SD.border}`,
              }}>
                <Stat label="SCORE MÉD" value={avgScore} size="sm" accent={scoreColor(avgScore)} />
                <Stat label="DIST TOTAL" value={totalKm.toFixed(1)} unit="km" size="sm" />
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
