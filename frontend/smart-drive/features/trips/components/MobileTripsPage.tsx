'use client';

import React, { useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Btn, Tag, Dot } from '@/features/shared/ui/primitives';
import { TripStatus, type Trip } from '@/features/shared/types';
import { formatDistance, formatDuration } from '../derive';
import { useTrips } from '../hooks';
import { MobileTripReportPage } from './MobileTripReportPage';

type MobileTab = 'home' | 'live' | 'map' | 'trips' | 'menu';

export function MobileTripsPage({ onNavigate }: { onNavigate?: (tab: MobileTab) => void }) {
  const trips = useTrips();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  if (selectedTripId) {
    return (
      <div style={{ display: 'grid', gap: 0 }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${SD.border}`, background: SD.surface }}>
          <Btn tone="ghost" size="sm" icon={Icon.back(12)} onClick={() => setSelectedTripId(null)}>
            VOLTAR
          </Btn>
        </div>
        <MobileTripReportPage tripId={selectedTripId} />
      </div>
    );
  }

  const list = trips.data ?? [];
  const active = list.filter((t) => t.status === TripStatus.ACTIVE);
  const finished = list.filter((t) => t.status === TripStatus.FINISHED);

  return (
    <div style={{ padding: '18px 18px 24px', display: 'grid', gap: 16 }}>
      <div>
        <div className="sd-label" style={{ fontSize: 9, color: SD.primary }}>HISTÓRICO</div>
        <div className="sd-display" style={{ fontSize: 24, lineHeight: 1.05 }}>VIAGENS</div>
      </div>

      {trips.isLoading && (
        <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim }}>Carregando viagens…</div>
      )}

      {trips.isError && (
        <StateCard title="INDISPONÍVEL" text="Não foi possível carregar as viagens no momento." tone={SD.danger} />
      )}

      {!trips.isLoading && !trips.isError && list.length === 0 && (
        <StateCard title="SEM VIAGENS" text="Inicie uma demo ou uma viagem real para ver o histórico aqui." tone={SD.textDim} />
      )}

      {active.length > 0 && (
        <section style={{ display: 'grid', gap: 8 }}>
          <div className="sd-label" style={{ fontSize: 10 }}>EM ANDAMENTO</div>
          {active.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              active
              onClick={() => onNavigate?.('live')}
            />
          ))}
        </section>
      )}

      {finished.length > 0 && (
        <section style={{ display: 'grid', gap: 8 }}>
          <div className="sd-label" style={{ fontSize: 10 }}>ENCERRADAS</div>
          {finished.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onClick={() => setSelectedTripId(trip.id)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function TripCard({ trip, active = false, onClick }: { trip: Trip; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="sd-btn"
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 64,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 12,
        alignItems: 'center',
        padding: 14,
        background: SD.surface,
        border: `1.5px solid ${active ? SD.primary : SD.border}`,
        color: SD.text,
        textAlign: 'left',
      }}
    >
      <span>
        <span className="sd-mono" style={{ fontSize: 13, fontWeight: 700 }}>
          {active ? trip.id : `${formatDistance(trip.distanceKm, trip.distanceKm > 0)} · ${formatDuration(trip.durationSeconds)}`}
        </span>
        <span className="sd-mono" style={{ display: 'block', fontSize: 10, color: SD.textDim, marginTop: 4 }}>
          {active ? 'toque para ver telemetria ao vivo' : `score ${Math.round(trip.drivingScore)} · ${trip.id}`}
        </span>
      </span>
      {active ? (
        <Tag tone="cyan"><Dot tone="cyan" size={5} /> AO VIVO</Tag>
      ) : (
        <span style={{ color: SD.textDim }}>{Icon.arrow(14)}</span>
      )}
    </button>
  );
}

function StateCard({ title, text, tone }: { title: string; text: string; tone: string }) {
  return (
    <div style={{ padding: 16, background: SD.surface, border: `1.5px solid ${SD.border}` }}>
      <div className="sd-label" style={{ fontSize: 10, color: tone, marginBottom: 6 }}>{title}</div>
      <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}
