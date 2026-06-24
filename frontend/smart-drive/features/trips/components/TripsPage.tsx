'use client';

import React, { useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Panel } from '@/features/shared/ui/primitives';
import { DeviceStatus, TripStatus, type Trip } from '@/features/shared/types';
import { useVehicles } from '@/features/vehicles';
import { useDevices } from '@/features/devices';
import { TripReportPage } from './TripReportPage';
import { useTrips, useStartTrip, useFinishTrip } from '../hooks';
import { formatDistance, formatDuration } from '../derive';

/**
 * Tela de Viagens (auditoria TRIP-01..04): iniciar / em andamento / encerrar /
 * listar encerradas, com estados honestos. Persistência é do módulo de viagens
 * do Pedro (PED-RF-05) — aqui contra os handlers MSW de dev. Ver
 * docs/bloqueios-equipe-001.xml.
 */
export function TripsPage() {
  const trips = useTrips();
  const vehicles = useVehicles();
  const devices = useDevices();
  const startM = useStartTrip();
  const finishM = useFinishTrip();

  const [vehicleId, setVehicleId] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const all = trips.data ?? [];
  const active = all.find((t) => t.status === TripStatus.ACTIVE) ?? null;
  const finished = all.filter((t) => t.status === TripStatus.FINISHED);
  const selected = selectedId ?? finished[0]?.id ?? null;

  const vehicleList = vehicles.data ?? [];
  const chosenVehicle = vehicleId || vehicleList[0]?.id || '';
  const pairedDevice = (devices.data ?? []).find((d) => d.vehicleId === chosenVehicle) ?? null;
  const deviceOnline = pairedDevice?.status === DeviceStatus.ONLINE;
  const deviceIdentifier = pairedDevice?.deviceCode || pairedDevice?.id || '';
  const canStart = !!chosenVehicle && !!deviceIdentifier && !active && !startM.isPending;

  const handleStart = () => {
    if (!canStart) return;
    startM.mutate({ vehicleId: chosenVehicle, deviceId: deviceIdentifier });
  };

  return (
    <div style={{
      height: '100%', background: SD.bg, display: 'grid',
      gridTemplateColumns: '340px 1fr', gap: 1,
    }}>
      {/* LEFT: controls + list */}
      <div style={{ background: SD.surface, borderRight: `1px solid ${SD.border}`, padding: 20, overflow: 'auto', display: 'grid', gap: 16, alignContent: 'start' }}>
        <span className="sd-display" style={{ fontSize: 18 }}>VIAGENS</span>

        {/* Iniciar / viagem em andamento */}
        {active ? (
          <Panel title="VIAGEM EM ANDAMENTO" kicker={active.id.toUpperCase()} accent={SD.danger}>
            <Tag tone="red"><Dot tone="red" size={5} /> ATIVA</Tag>
            <div style={{ marginTop: 12 }}>
              <Btn
                tone="danger" size="md" full icon={Icon.stop(12)}
                onClick={() => finishM.mutate(active.id)}
                style={finishM.isPending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
              >
                {finishM.isPending ? 'ENCERRANDO…' : 'ENCERRAR VIAGEM'}
              </Btn>
            </div>
          </Panel>
        ) : (
          <Panel title="INICIAR VIAGEM" accent={SD.primary}>
            {vehicles.isError ? (
              <DepNote text="Não foi possível carregar os veículos no momento. Faça login e tente novamente." />
            ) : vehicleList.length === 0 ? (
              <DepNote text="Cadastre um veículo na aba Veículos antes de iniciar uma viagem." />
            ) : (
              <>
                <div className="sd-label" style={{ fontSize: 9, marginBottom: 6 }}>VEÍCULO</div>
                <select
                  aria-label="Veículo da viagem"
                  value={chosenVehicle}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="sd-mono"
                  style={{ width: '100%', padding: '8px 10px', background: SD.surface2, color: SD.text, border: `1px solid ${SD.border}`, fontSize: 12 }}
                >
                  {vehicleList.map((v) => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model}</option>
                  ))}
                </select>

                {!pairedDevice && (
                  <div className="sd-mono" style={{ fontSize: 10, color: SD.warning, marginTop: 8 }}>
                    Nenhum dispositivo pareado a este veículo. Pareie um SmartDrive na aba Dispositivos.
                  </div>
                )}

                {pairedDevice && !deviceOnline && (
                  <div className="sd-mono" style={{ fontSize: 10, color: SD.warning, marginTop: 8 }}>
                    Dispositivo pareado, mas sem pacote recente. A viagem pode iniciar e ficará online quando o ESP32 transmitir.
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <Btn
                    tone="primary" size="md" full icon={Icon.play(12)}
                    onClick={handleStart}
                    disabled={!canStart}
                    title={!chosenVehicle ? 'Selecione um veículo' : !deviceIdentifier ? 'Pareie um dispositivo ao veículo' : undefined}
                  >
                    {startM.isPending ? 'INICIANDO…' : 'INICIAR VIAGEM'}
                  </Btn>
                </div>
                {startM.isError && (
                  <div role="alert" className="sd-mono" style={{ fontSize: 11, color: SD.danger, marginTop: 8 }}>
                    Falha ao iniciar a viagem. Tente novamente.
                  </div>
                )}
              </>
            )}
          </Panel>
        )}

        {/* Lista de encerradas */}
        <div>
          <div className="sd-label" style={{ fontSize: 9, marginBottom: 8 }}>ENCERRADAS</div>
          {trips.isLoading && <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim }}>Carregando…</div>}
          {trips.isError && <DepNote text="Não foi possível carregar as viagens no momento." />}
          {!trips.isLoading && !trips.isError && finished.length === 0 && (
            <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, padding: 10, border: `1px dashed ${SD.border}` }}>
              Nenhuma viagem encerrada ainda.
            </div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {finished.map((t) => (
              <TripRow key={t.id} trip={t} active={selected === t.id} onClick={() => setSelectedId(t.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: report of the selected trip */}
      <div style={{ background: SD.bg, overflow: 'hidden', position: 'relative' }}>
        {selected ? (
          <TripReportPage tripId={selected} />
        ) : (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: SD.textDim }} className="sd-mono">
            Selecione uma viagem encerrada para ver o relatório.
          </div>
        )}
      </div>
    </div>
  );
}

function TripRow({ trip, active, onClick }: { trip: Trip; active: boolean; onClick: () => void }) {
  return (
    <div
      role="button"
      aria-label={`Viagem ${trip.id}`}
      onClick={onClick}
      className="sd-btn"
      style={{
        padding: 12, border: `1.5px solid ${active ? SD.primary : SD.border}`,
        background: active ? 'rgba(0,229,255,0.05)' : SD.surface2,
      }}
    >
      <div className="sd-mono" style={{ fontSize: 12, fontWeight: 700 }}>
        {formatDistance(trip.distanceKm, trip.distanceKm > 0)} · {formatDuration(trip.durationSeconds)}
      </div>
      <div className="sd-mono" style={{ fontSize: 10, color: SD.textDim, marginTop: 2 }}>
        score {Math.round(trip.drivingScore)} · {trip.id}
      </div>
    </div>
  );
}

function DepNote({ text }: { text: string }) {
  return (
    <div style={{ padding: 12, border: `1.5px solid ${SD.warning}`, background: SD.warningSoft }}>
      <div className="sd-label" style={{ fontSize: 9, color: SD.warning, marginBottom: 4 }}>INDISPONÍVEL</div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: SD.textDim }}>{text}</div>
    </div>
  );
}
