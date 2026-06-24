'use client';

import React, { useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot, Btn, Panel } from '@/features/shared/ui/primitives';
import { DeviceStatus, type Device } from '@/features/shared/types';
import { useLastPoint, useLiveStatus, isValidSpeed } from '@/features/shared/realtime';
import { useDevices } from '../hooks';

type TagTone = 'neutral' | 'cyan' | 'red' | 'green' | 'yellow' | 'blue';
type DotTone = 'cyan' | 'red' | 'green' | 'yellow' | 'gray';
const STATUS_META: Record<DeviceStatus, { tag: TagTone; dot: DotTone; label: string }> = {
  [DeviceStatus.ONLINE]: { tag: 'green', dot: 'green', label: 'ONLINE' },
  [DeviceStatus.OFFLINE]: { tag: 'neutral', dot: 'gray', label: 'OFFLINE' },
  [DeviceStatus.PAIRING]: { tag: 'cyan', dot: 'cyan', label: 'PAREANDO' },
  [DeviceStatus.ERROR]: { tag: 'red', dot: 'red', label: 'ERRO' },
};

function relativeTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `há ${s}s`;
  if (s < 3600) return `há ${Math.round(s / 60)}min`;
  if (s < 86400) return `há ${Math.round(s / 3600)}h`;
  return `há ${Math.round(s / 86400)}d`;
}

/** SSID do ponto de acesso de configuração servido pelo firmware (provisioning.h). */
const SETUP_AP_SSID = 'SmartDrive-Setup';

export function DevicesPage() {
  const devices = useDevices();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pairingOpen, setPairingOpen] = useState(false);

  const list = devices.data ?? [];
  const selected = list.find((d) => d.id === selectedId) ?? list[0] ?? null;

  return (
    <div style={{
      height: '100%', overflow: 'auto', background: SD.bg, padding: 24,
      display: 'grid', gap: 16, gridTemplateColumns: '360px 1fr', alignContent: 'start',
    }}>
      {/* LEFT: device list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="sd-display" style={{ fontSize: 18 }}>DISPOSITIVOS</span>
          <Btn tone="outline" size="sm" icon={Icon.wifi(12)} onClick={() => setPairingOpen(true)} title="Configurar o Wi-Fi de um SmartDrive">PAREAR</Btn>
        </div>

        {devices.isLoading && (
          <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, padding: 12 }}>Carregando dispositivos…</div>
        )}

        {devices.isError && (
          <div style={{ padding: 14, border: `1.5px solid ${SD.warning}`, background: SD.warningSoft, color: SD.text }}>
            <div className="sd-label" style={{ fontSize: 9, color: SD.warning, marginBottom: 4 }}>PAREAMENTO INDISPONÍVEL</div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: SD.textDim }}>
              Não foi possível carregar os dispositivos. O pareamento de hardware (ESP32)
              ainda não está disponível nesta versão.
            </div>
          </div>
        )}

        {!devices.isLoading && !devices.isError && list.length === 0 && (
          <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, padding: 12, border: `1px dashed ${SD.border}`, lineHeight: 1.5 }}>
            Nenhum dispositivo pareado. O pareamento de hardware (ESP32) ainda não está disponível nesta versão.
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
              <Btn tone="ghost" size="sm" disabled title="Vínculo de veículo — em breve">VINCULAR VEÍCULO</Btn>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Field label="STATUS" value={STATUS_META[selected.status].label} accent={SD.primary} />
              <Field label="FIRMWARE" value={selected.firmwareVersion} />
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

        <LiveTelemetryPanel />
      </div>

      {pairingOpen && <PairingModal onClose={() => setPairingOpen(false)} />}
    </div>
  );
}

/**
 * Guia de pareamento. O provisioning de Wi-Fi acontece NA PRÓPRIA ESP32 (captive
 * portal), não por aqui: o celular precisa entrar no AP do dispositivo, então este
 * app na nuvem não consegue falar com a placa durante a configuração. O honesto é
 * orientar o passo-a-passo. Ver firmware/main/provisioning.c.
 */
function PairingModal({ onClose }: { onClose: () => void }) {
  const steps = [
    'Ligue o SmartDrive. Na primeira vez (ou após resetar), ele cria uma rede Wi-Fi própria.',
    `No celular, abra o Wi-Fi e conecte-se à rede "${SETUP_AP_SSID}" (rede aberta, sem senha).`,
    'A tela de configuração abre sozinha. Se não abrir, acesse http://192.168.4.1 no navegador.',
    'Escolha a rede do local (ou o seu roteador/hotspot), digite a senha e toque em Conectar.',
    'O SmartDrive reinicia, conecta à rede e começa a transmitir. O status fica ONLINE aqui.',
  ];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Parear dispositivo"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50,
        display: 'grid', placeItems: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 100%)', maxHeight: '90vh', overflow: 'auto',
          background: SD.surface, border: `1.5px solid ${SD.primary}`, padding: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="sd-display" style={{ fontSize: 16 }}>PAREAR DISPOSITIVO</span>
          <Btn tone="ghost" size="sm" onClick={onClose} aria-label="Fechar">FECHAR</Btn>
        </div>
        <div style={{ fontSize: 12, color: SD.textDim, lineHeight: 1.5, marginBottom: 16 }}>
          A configuração de Wi-Fi é feita no próprio SmartDrive. Siga os passos no celular:
        </div>

        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10, alignItems: 'start' }}>
              <span className="sd-mono" style={{
                width: 24, height: 24, display: 'grid', placeItems: 'center',
                background: SD.surface2, border: `1px solid ${SD.primary}`, color: SD.primary,
                fontSize: 12, fontWeight: 700,
              }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: SD.text, lineHeight: 1.5, paddingTop: 2 }}>{s}</span>
            </li>
          ))}
        </ol>

        <div style={{
          marginTop: 16, padding: 12, background: SD.surface2, border: `1px solid ${SD.border}`,
          fontSize: 12, color: SD.textDim, lineHeight: 1.5,
        }}>
          <span className="sd-label" style={{ fontSize: 9, color: SD.primary }}>REDE DE CONFIGURAÇÃO</span>
          <div className="sd-mono" style={{ fontSize: 13, color: SD.text, marginTop: 4 }}>{SETUP_AP_SSID}</div>
        </div>
      </div>
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
          FW {device.firmwareVersion} · {relativeTime(device.lastSeenAt)}
        </div>
      </div>
      <Tag tone={meta.tag}>
        <Dot tone={meta.dot} size={5} pulse={online} /> {meta.label}
      </Tag>
    </div>
  );
}

/** Estado de telemetria AO VIVO do dispositivo que está transmitindo (store real). */
function LiveTelemetryPanel() {
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
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
