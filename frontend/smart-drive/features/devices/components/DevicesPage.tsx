'use client';

import React, { type FormEvent, useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Panel } from '@/features/shared/ui/primitives';
import { DeviceStatus, type Device } from '@/features/shared/types';
import { useLastPoint, useLiveStatus, isValidSpeed } from '@/features/shared/realtime';
import { useIsMobile } from '@/features/shared/ui/useIsMobile';
import { ApiError } from '@/lib/api';
import { useVehicles } from '@/features/vehicles/hooks';
import { useCreateDevice, useDevices, usePairDevice } from '../hooks';
import { PairingModal } from './PairingModal';

type TagTone = 'neutral' | 'cyan' | 'red' | 'green' | 'yellow' | 'blue';
type DotTone = 'cyan' | 'red' | 'green' | 'yellow' | 'gray';
const STATUS_META: Record<DeviceStatus, { tag: TagTone; dot: DotTone; label: string }> = {
  [DeviceStatus.ONLINE]: { tag: 'green', dot: 'green', label: 'ONLINE' },
  [DeviceStatus.OFFLINE]: { tag: 'neutral', dot: 'gray', label: 'OFFLINE' },
  [DeviceStatus.PAIRING]: { tag: 'cyan', dot: 'cyan', label: 'PAREANDO' },
  [DeviceStatus.ERROR]: { tag: 'red', dot: 'red', label: 'ERRO' },
};

type Mode = { kind: 'idle' } | { kind: 'create' } | { kind: 'pair' };

function relativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `há ${s}s`;
  if (s < 3600) return `há ${Math.round(s / 60)}min`;
  if (s < 86400) return `há ${Math.round(s / 3600)}h`;
  return `há ${Math.round(s / 86400)}d`;
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400) return 'Dados inválidos — revise código, nome e veículo.';
    if (err.status === 403) return 'Este veículo não pertence ao usuário autenticado.';
    if (err.status === 404) return 'Dispositivo ou veículo não encontrado.';
    if (err.status === 409) return 'Já existe um dispositivo com este código.';
    return `Falha na operação (${err.status}).`;
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}

export function DevicesPage() {
  const devices = useDevices();
  const vehicles = useVehicles();
  const createM = useCreateDevice();
  const pairM = usePairDevice();
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pairingOpen, setPairingOpen] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [serverError, setServerError] = useState<string | null>(null);

  const list = devices.data ?? [];
  const vehicleList = vehicles.data ?? [];
  const selected = list.find((d) => d.id === selectedId) ?? list[0] ?? null;
  const defaultVehicleId = vehicleList[0]?.id ?? '';
  const [createForm, setCreateForm] = useState({
    name: 'ESP32 Demo',
    deviceCode: 'esp32-demo-001',
    firmwareVersion: 'v0.1.0',
    vehicleId: '',
  });
  const [pairVehicleId, setPairVehicleId] = useState('');

  const openCreate = () => {
    setServerError(null);
    setCreateForm((f) => ({ ...f, vehicleId: f.vehicleId || defaultVehicleId }));
    setMode({ kind: 'create' });
  };

  const openPair = () => {
    if (!selected) return;
    setServerError(null);
    setPairVehicleId(selected.vehicleId || defaultVehicleId);
    setMode({ kind: 'pair' });
  };

  const closeMode = () => {
    setServerError(null);
    setMode({ kind: 'idle' });
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    createM.mutate(createForm, {
      onSuccess: (created) => {
        setSelectedId(created.id);
        closeMode();
      },
      onError: (err) => setServerError(describeError(err)),
    });
  };

  const handlePair = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setServerError(null);
    pairM.mutate({ id: selected.id, vehicleId: pairVehicleId }, {
      onSuccess: (updated) => {
        setSelectedId(updated.id);
        closeMode();
      },
      onError: (err) => setServerError(describeError(err)),
    });
  };

  return (
    <div style={{
      height: isMobile ? 'auto' : '100%', overflow: 'auto', background: SD.bg, padding: isMobile ? 18 : 24,
      display: 'grid', gap: 16, gridTemplateColumns: isMobile ? '1fr' : '360px 1fr', alignContent: 'start',
    }}>
      {/* LEFT: device list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="sd-display" style={{ fontSize: 18 }}>DISPOSITIVOS</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn tone="outline" size="sm" icon={Icon.plus(12)} onClick={openCreate}>CADASTRAR</Btn>
            <Btn tone="ghost" size="sm" icon={Icon.wifi(12)} onClick={() => setPairingOpen(true)} title="Configurar o Wi-Fi de um SmartDrive">WI-FI</Btn>
          </div>
        </div>

        {devices.isLoading && (
          <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, padding: 12 }}>Carregando dispositivos…</div>
        )}

        {devices.isError && (
          <div style={{ padding: 14, border: `1.5px solid ${SD.danger}`, background: SD.dangerSoft, color: SD.text }}>
            <div className="sd-label" style={{ fontSize: 9, color: SD.danger, marginBottom: 4 }}>FALHA AO CARREGAR</div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: SD.textDim }}>
              Não foi possível carregar os dispositivos. Verifique conexão e tente novamente.
            </div>
            <div style={{ marginTop: 10 }}><Btn tone="outline" size="sm" onClick={() => devices.refetch()}>TENTAR NOVAMENTE</Btn></div>
          </div>
        )}

        {!devices.isLoading && !devices.isError && list.length === 0 && (
          <div style={{ padding: 18, border: `1px dashed ${SD.border}`, textAlign: 'center' }}>
            <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, marginBottom: 12, lineHeight: 1.5 }}>
              Nenhum dispositivo cadastrado. Registre o código da ESP32 e vincule a um veículo.
            </div>
            <Btn tone="primary" size="sm" icon={Icon.plus(12)} onClick={openCreate}>CADASTRAR DISPOSITIVO</Btn>
          </div>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          {list.map((d) => (
            <DeviceCard key={d.id} device={d} active={selected?.id === d.id} onClick={() => setSelectedId(d.id)} />
          ))}
        </div>
      </div>

      {/* RIGHT: detail + live telemetry */}
      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        {selected ? (
          <Panel
            title={selected.name}
            kicker={selected.deviceCode}
            accent={SD.primary}
            tools={
              <Btn tone="ghost" size="sm" onClick={openPair} disabled={vehicleList.length === 0}>VINCULAR VEÍCULO</Btn>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 14 }}>
              <Field label="STATUS" value={STATUS_META[selected.status].label} accent={SD.primary} />
              <Field label="FIRMWARE" value={selected.firmwareVersion || '—'} />
              <Field label="ÚLTIMA COMUNICAÇÃO" value={relativeTime(selected.lastSeenAt)} />
              <Field label="VEÍCULO VINCULADO" value={selected.vehicleId || '— não vinculado'} />
              <Field label="CÓDIGO" value={selected.deviceCode} />
            </div>
          </Panel>
        ) : (
          !devices.isLoading && (
            <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, padding: 16, border: `1px dashed ${SD.border}` }}>
              Selecione um dispositivo para ver os detalhes.
            </div>
          )
        )}

        {mode.kind === 'create' && (
          <Panel title="CADASTRAR DISPOSITIVO" kicker="REGISTRO" accent={SD.primary}>
            <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
              <DeviceInput label="NOME" value={createForm.name} onChange={(name) => setCreateForm((f) => ({ ...f, name }))} />
              <DeviceInput label="CÓDIGO DA ESP32" value={createForm.deviceCode} onChange={(deviceCode) => setCreateForm((f) => ({ ...f, deviceCode }))} />
              <div className="sd-mono" style={{ fontSize: 11, color: SD.textDim, lineHeight: 1.5 }}>
                Use exatamente o mesmo código gravado no firmware. A ESP atual transmite como <span style={{ color: SD.primary }}>esp32-demo-001</span>;
                se cadastrar <span style={{ color: SD.primary }}>esp32-demo-002</span>, o firmware também precisa estar como 002.
              </div>
              <DeviceInput label="FIRMWARE" value={createForm.firmwareVersion} onChange={(firmwareVersion) => setCreateForm((f) => ({ ...f, firmwareVersion }))} />
              <VehicleSelect
                label="VEÍCULO"
                value={createForm.vehicleId}
                vehicles={vehicleList}
                loading={vehicles.isLoading}
                onChange={(vehicleId) => setCreateForm((f) => ({ ...f, vehicleId }))}
              />
              {serverError && <FormError>{serverError}</FormError>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn tone="ghost" type="button" onClick={closeMode}>CANCELAR</Btn>
                <Btn tone="primary" type="submit" disabled={createM.isPending || !createForm.name || !createForm.deviceCode || !createForm.vehicleId}>
                  {createM.isPending ? 'SALVANDO…' : 'SALVAR'}
                </Btn>
              </div>
            </form>
          </Panel>
        )}

        {mode.kind === 'pair' && selected && (
          <Panel title="VINCULAR VEÍCULO" kicker={selected.deviceCode} accent={SD.primary}>
            <form onSubmit={handlePair} style={{ display: 'grid', gap: 12 }}>
              <VehicleSelect
                label="VEÍCULO"
                value={pairVehicleId}
                vehicles={vehicleList}
                loading={vehicles.isLoading}
                onChange={setPairVehicleId}
              />
              {serverError && <FormError>{serverError}</FormError>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn tone="ghost" type="button" onClick={closeMode}>CANCELAR</Btn>
                <Btn tone="primary" type="submit" disabled={pairM.isPending || !pairVehicleId}>
                  {pairM.isPending ? 'VINCULANDO…' : 'VINCULAR'}
                </Btn>
              </div>
            </form>
          </Panel>
        )}

        <LiveTelemetryPanel isMobile={isMobile} />
      </div>

      {pairingOpen && <PairingModal onClose={() => setPairingOpen(false)} />}
    </div>
  );
}

function DeviceCard({ device, active, onClick }: { device: Device; active: boolean; onClick: () => void }) {
  const meta = STATUS_META[device.status];
  const online = device.status === DeviceStatus.ONLINE;
  return (
    <div
      role="button"
      aria-label={device.deviceCode}
      onClick={onClick}
      className="sd-btn"
      style={{
        padding: 14, border: `1.5px solid ${active ? SD.primary : SD.border}`,
        background: active ? 'rgba(0,229,255,0.05)' : SD.surface,
        display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 12, alignItems: 'center',
      }}
    >
      <div style={{
        width: 36, height: 36, background: SD.surface2, border: `1px solid ${SD.border}`,
        display: 'grid', placeItems: 'center', color: active ? SD.primary : SD.textDim,
      }}>
        {Icon.chip(18)}
      </div>
      <div>
        <div className="sd-mono" style={{ fontSize: 12, fontWeight: 700 }}>{device.deviceCode}</div>
        <div className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>
          FW {device.firmwareVersion || '—'} · {relativeTime(device.lastSeenAt)}
        </div>
      </div>
      <Tag tone={meta.tag}>
        <Dot tone={meta.dot} size={5} pulse={online} /> {meta.label}
      </Tag>
    </div>
  );
}

/** Estado de telemetria AO VIVO do dispositivo que está transmitindo (store real). */
function LiveTelemetryPanel({ isMobile }: { isMobile: boolean }) {
  const { online } = useLiveStatus();
  const point = useLastPoint();
  const hasFix = point != null && point.lat != null && point.lng != null;
  const accelG = point ? Math.hypot(point.accelX, point.accelY, point.accelZ) / 9.80665 : null;

  return (
    <Panel title="TELEMETRIA AO VIVO" kicker={online ? 'TRANSMITINDO' : 'SEM SINAL'} accent={online ? SD.success : SD.textDim}>
      {!point ? (
        <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim }}>
          Nenhum dispositivo transmitindo telemetria no momento.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 14 }}>
          <Field label="CONEXÃO" value={online ? 'ONLINE' : 'OFFLINE (sem pacote recente)'} accent={online ? SD.success : SD.danger} />
          <Field label="GPS" value={hasFix ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : 'sem fix'} />
          <Field label="SATÉLITES" value={typeof point.satellites === 'number' ? String(point.satellites) : '—'} />
          <Field label="VELOCIDADE" value={isValidSpeed(point.speedKmh) ? `${Math.round(point.speedKmh)} km/h` : '—'} />
          <Field label="IMU |a|" value={accelG != null ? `${accelG.toFixed(2)} g` : '—'} accent={SD.primary} />
        </div>
      )}
    </Panel>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
      <div style={{
        padding: '10px 12px', background: SD.surface2, border: `1px solid ${SD.border}`,
        color: accent || SD.text, fontSize: 13, fontWeight: 500,
      }} className="sd-mono">
        {value}
      </div>
    </div>
  );
}

function DeviceInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%', padding: '10px 12px', background: SD.surface2, border: `1px solid ${SD.border}`,
          color: SD.text, fontFamily: SD.fontMono, fontSize: 13,
        }}
      />
    </label>
  );
}

function VehicleSelect({
  label, value, vehicles, loading, onChange,
}: {
  label: string;
  value: string;
  vehicles: Array<{ id: string; brand: string; model: string; year: number }>;
  loading: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={loading || vehicles.length === 0}
        style={{
          width: '100%', padding: '10px 12px', background: SD.surface2, border: `1px solid ${SD.border}`,
          color: SD.text, fontFamily: SD.fontMono, fontSize: 13,
        }}
      >
        <option value="">{loading ? 'Carregando veículos…' : 'Selecione um veículo'}</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.year}</option>
        ))}
      </select>
      {!loading && vehicles.length === 0 && (
        <div className="sd-mono" style={{ marginTop: 6, fontSize: 11, color: SD.warning }}>
          Cadastre um veículo antes de vincular o dispositivo.
        </div>
      )}
    </label>
  );
}

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div className="sd-mono" style={{ padding: 10, border: `1px solid ${SD.danger}`, background: SD.dangerSoft, color: SD.danger, fontSize: 12 }}>
      {children}
    </div>
  );
}
