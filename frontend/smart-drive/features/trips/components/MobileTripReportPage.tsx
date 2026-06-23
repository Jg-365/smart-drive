'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Tag, Dot, Stat } from '@/features/shared/ui/primitives';
import { MobileShell } from '@/features/shell/components/MobileShell';
import { EVENT_META } from '@/features/dashboard/derive';
import { EventSeverity, TripStatus } from '@/features/shared/types';
import { useTrips, useTripSummary, useTripRoute } from '../hooks';
import {
  buildRecommendations, classifyScore, formatDistance, formatDuration, hasGpsData,
} from '../derive';

const SEV_TONE: Record<EventSeverity, string> = {
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

type MobileTab = 'home' | 'live' | 'map' | 'trips' | 'menu';

export function MobileTripReportPage({ tripId, onNavigate }: { tripId?: string; onNavigate?: (tab: MobileTab) => void }) {
  const trips = useTrips();
  const resolvedId =
    tripId ??
    trips.data?.find((t) => t.status === TripStatus.FINISHED)?.id ??
    trips.data?.[0]?.id ??
    null;

  const summary = useTripSummary(resolvedId);
  const route = useTripRoute(resolvedId);

  const loading = trips.isLoading || summary.isLoading;
  const title = summary.data ? summary.data.trip.id.toUpperCase() : 'VIAGEM';

  return (
    <MobileShell active="trips" title={title} onNav={onNavigate}>
      <div style={{ padding: '14px 18px 100px', display: 'grid', gap: 16 }}>
        {loading && <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim }}>Carregando…</div>}

        {!loading && (summary.isError || !summary.data) && (
          <div className="sd-mono" style={{ fontSize: 12, color: SD.danger }}>
            Não foi possível carregar o relatório.
          </div>
        )}

        {!loading && summary.data && (() => {
          const { trip, events, fuelEstimate } = summary.data;
          const gps = hasGpsData(route.data);
          const score = classifyScore(trip.drivingScore);
          const recs = buildRecommendations(events);

          return (
            <>
              <div>
                <Tag tone="green"><Dot tone="green" size={5} pulse={false} /> ENCERRADA</Tag>
                <div className="sd-display" style={{ fontSize: 22, lineHeight: 1.05, marginTop: 8 }}>
                  {formatDistance(trip.distanceKm, gps)}
                </div>
                <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, marginTop: 6 }}>
                  {formatDuration(trip.durationSeconds)}
                </div>
              </div>

              {/* KPI grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: SD.border }}>
                <KpiCell l="DISTÂNCIA" v={gps ? trip.distanceKm.toFixed(1) : '—'} u={gps ? 'km' : 'n/d'} />
                <KpiCell l="DURAÇÃO" v={formatDuration(trip.durationSeconds)} u="" />
                <KpiCell l="VEL. MÉD" v={String(trip.averageSpeedKmh)} u="km/h" />
                <KpiCell l="VEL. MÁX" v={String(trip.maxSpeedKmh)} u="km/h" a={SD.warning} />
                <KpiCell l="CONSUMO" v={fuelEstimate.adjustedConsumptionKmL.toFixed(1)} u="km/L" a={SD.success} />
                <KpiCell l="GASTO" v={fuelEstimate.estimatedLitersSpent.toFixed(2)} u="L" />
              </div>

              {/* Score */}
              <div style={{ background: SD.surface, border: `1.5px solid ${SD.border}`, padding: 16 }}>
                <div className="sd-label" style={{ fontSize: 10, marginBottom: 8 }}>SCORE DA VIAGEM</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span className="sd-display" style={{ fontSize: 40, color: SD.primary, lineHeight: 1 }}>
                    {Math.round(trip.drivingScore)}
                  </span>
                  <span className="sd-mono" style={{ fontSize: 12, color: SD.textDim }}>/ 100</span>
                </div>
                <div className="sd-label" style={{ fontSize: 12, marginTop: 6 }}>CONDUÇÃO {score.label.toUpperCase()}</div>
              </div>

              {/* Events */}
              <div>
                <div className="sd-label" style={{ fontSize: 10, marginBottom: 10 }}>EVENTOS · {events.length}</div>
                {events.length === 0 ? (
                  <div className="sd-mono" style={{ fontSize: 12, color: SD.success }}>
                    Nenhum evento de risco. 👏
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {events.map((e) => {
                      const meta = EVENT_META[e.type];
                      const c = SEV_TONE[e.severity];
                      return (
                        <div key={e.id} style={{
                          display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 12, alignItems: 'center',
                          padding: 12, background: SD.surface, border: `1px solid ${SD.border}`,
                        }}>
                          <div style={{ width: 32, height: 32, border: `1.5px solid ${c}`, color: c, display: 'grid', placeItems: 'center' }}>
                            {meta?.icon(14, c)}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{e.description || meta?.label}</div>
                          <span className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>{eventTime(e.timestamp)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div>
                <div className="sd-label" style={{ fontSize: 10, marginBottom: 10 }}>RECOMENDAÇÕES</div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                  {recs.map((r, i) => (
                    <li key={i} style={{ fontSize: 12, color: SD.text, lineHeight: 1.5 }}>{r}</li>
                  ))}
                </ul>
              </div>
            </>
          );
        })()}
      </div>
    </MobileShell>
  );
}

function KpiCell({ l, v, u, a }: { l: string; v: string; u: string; a?: string }) {
  return (
    <div style={{ background: SD.surface, padding: 14 }}>
      <Stat label={l} value={v} unit={u} size="md" accent={a} />
    </div>
  );
}
