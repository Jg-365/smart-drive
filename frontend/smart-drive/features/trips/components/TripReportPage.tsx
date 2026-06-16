'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Tag, Dot, Btn, Stat, Panel } from '@/features/shared/ui/primitives';
import { EVENT_META } from '@/features/dashboard/derive';
import { EventSeverity, TripStatus } from '@/features/shared/types';
import type { DrivingEvent } from '@/features/shared/types';
import { useTrips, useTripSummary, useTripRoute } from '../hooks';
import {
  buildRecommendations, classifyScore, formatDistance, formatDuration, hasGpsData,
} from '../derive';

const SEVERITY_LABEL: Record<EventSeverity, string> = {
  [EventSeverity.LOW]: 'Baixa',
  [EventSeverity.MEDIUM]: 'Média',
  [EventSeverity.HIGH]: 'Alta',
  [EventSeverity.CRITICAL]: 'Crítica',
};

const SEVERITY_TONE: Record<EventSeverity, string> = {
  [EventSeverity.LOW]: SD.textDim,
  [EventSeverity.MEDIUM]: SD.warning,
  [EventSeverity.HIGH]: SD.danger,
  [EventSeverity.CRITICAL]: SD.danger,
};

function eventTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function TripReportPage({ tripId, onBack }: { tripId?: string; onBack?: () => void }) {
  const trips = useTrips();
  const resolvedId =
    tripId ??
    trips.data?.find((t) => t.status === TripStatus.FINISHED)?.id ??
    trips.data?.[0]?.id ??
    null;

  const summary = useTripSummary(resolvedId);
  const route = useTripRoute(resolvedId);

  if (!resolvedId && !trips.isLoading) {
    return <CenteredCard title="NENHUMA VIAGEM" text="Não há viagens encerradas para exibir." />;
  }
  if (summary.isLoading || trips.isLoading) {
    return <CenteredCard title="CARREGANDO" text="Buscando resumo da viagem…" />;
  }
  if (summary.isError || !summary.data) {
    return (
      <CenteredCard title="ERRO" text="Não foi possível carregar o relatório.">
        <Btn tone="outline" size="sm" onClick={() => summary.refetch()}>TENTAR NOVAMENTE</Btn>
      </CenteredCard>
    );
  }

  const { trip, events, fuelEstimate } = summary.data;
  const gps = hasGpsData(route.data);
  const score = classifyScore(trip.drivingScore);
  const recommendations = buildRecommendations(events);

  return (
    <div style={{ height: '100%', overflow: 'auto', background: SD.bg, padding: 24, display: 'grid', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="sd-label" style={{ fontSize: 10, color: SD.primary }}>RELATÓRIO DE VIAGEM</span>
            <Tag tone="green"><Dot tone="green" size={5} pulse={false} /> ENCERRADA</Tag>
            <Tag>{trip.id.toUpperCase()}</Tag>
          </div>
          <div className="sd-display" style={{ fontSize: 30, lineHeight: 1 }}>
            {formatDistance(trip.distanceKm, gps)} · {formatDuration(trip.durationSeconds)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onBack && <Btn tone="outline" size="md" onClick={onBack}>VOLTAR</Btn>}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Panel padding={14}><Stat label="DISTÂNCIA" value={gps ? trip.distanceKm.toFixed(1) : '—'} unit={gps ? 'km' : ''} sub={gps ? undefined : 'não disponível'} /></Panel>
        <Panel padding={14}><Stat label="DURAÇÃO" value={formatDuration(trip.durationSeconds)} /></Panel>
        <Panel padding={14}><Stat label="VEL. MÉDIA" value={String(trip.averageSpeedKmh)} unit="km/h" accent={SD.primary} /></Panel>
        <Panel padding={14}><Stat label="VEL. MÁXIMA" value={String(trip.maxSpeedKmh)} unit="km/h" accent={SD.warning} /></Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Score */}
        <Panel title="SCORE DE CONDUÇÃO" kicker="FINAL" accent={SD.primary}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="sd-display" style={{ fontSize: 56, lineHeight: 1, color: SD.primary }}>
              {Math.round(trip.drivingScore)}
            </span>
            <span className="sd-mono" style={{ fontSize: 13, color: SD.textDim }}>/ 100</span>
          </div>
          <div className="sd-label" style={{ fontSize: 14, marginTop: 8 }}>
            CONDUÇÃO {score.label.toUpperCase()}
          </div>
        </Panel>

        {/* Consumo */}
        <Panel title="CONSUMO ESTIMADO" kicker="MODELO" accent={SD.success}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Stat label="CONSUMO" value={fuelEstimate.adjustedConsumptionKmL.toFixed(1)} unit="km/L" accent={SD.success} />
            <Stat label="GASTO" value={fuelEstimate.estimatedLitersSpent.toFixed(2)} unit="L" />
          </div>
          <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, marginTop: 10 }}>
            Confiança do modelo: {Math.round(fuelEstimate.confidenceLevel * 100)}%
            {fuelEstimate.estimatedCost != null && ` · ~R$ ${fuelEstimate.estimatedCost.toFixed(2)}`}
          </div>
        </Panel>
      </div>

      {/* Eventos */}
      <Panel title="EVENTOS DETECTADOS" kicker={`${events.length} NO TOTAL`} accent={events.length ? SD.danger : SD.success}>
        {events.length === 0 ? (
          <div className="sd-mono" style={{ fontSize: 13, color: SD.success }}>
            Nenhum evento de risco registrado nesta viagem. 👏
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {events.map((e: DrivingEvent) => {
              const meta = EVENT_META[e.type];
              return (
                <div key={e.id} style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr auto auto', gap: 10, alignItems: 'center',
                  padding: '8px 10px', background: SD.surface, border: `1px solid ${SD.border}`,
                }}>
                  <span style={{ color: SEVERITY_TONE[e.severity] }}>{meta?.icon(16, SEVERITY_TONE[e.severity])}</span>
                  <span style={{ fontSize: 13 }}>{e.description || meta?.label}</span>
                  <Tag tone={e.severity === EventSeverity.LOW ? 'neutral' : 'red'}>{SEVERITY_LABEL[e.severity]}</Tag>
                  <span className="sd-mono" style={{ fontSize: 11, color: SD.textDim }}>{eventTime(e.timestamp)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Trajeto */}
        <Panel title="TRAJETO" kicker="RESUMO" accent={SD.primary}>
          {gps ? (
            <div className="sd-mono" style={{ fontSize: 13, color: SD.text, lineHeight: 1.7 }}>
              {route.data!.length} pontos de GPS registrados.<br />
              Início: {route.data![0].lat.toFixed(4)}, {route.data![0].lng.toFixed(4)}<br />
              Fim: {route.data![route.data!.length - 1].lat.toFixed(4)}, {route.data![route.data!.length - 1].lng.toFixed(4)}
            </div>
          ) : (
            <div className="sd-mono" style={{ fontSize: 13, color: SD.textDim }}>
              Trajeto não disponível (sem dados de GPS).
            </div>
          )}
        </Panel>

        {/* Recomendações */}
        <Panel title="RECOMENDAÇÕES" kicker="COMO MELHORAR" accent={SD.success}>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
            {recommendations.map((r, i) => (
              <li key={i} style={{ fontSize: 13, color: SD.text, lineHeight: 1.5 }}>{r}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function CenteredCard({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', background: SD.bg, padding: 24 }}>
      <div style={{ textAlign: 'center', display: 'grid', gap: 12, justifyItems: 'center' }}>
        <div className="sd-label" style={{ fontSize: 12, color: SD.textDim }}>{title}</div>
        <div className="sd-mono" style={{ fontSize: 13, color: SD.text }}>{text}</div>
        {children}
      </div>
    </div>
  );
}
