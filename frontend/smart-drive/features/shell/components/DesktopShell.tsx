'use client';

import React, { useEffect, useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot } from '@/features/shared/ui/primitives';
import { BrandLogo } from '@/features/shared/ui/BrandLogo';
import { ThemeToggle } from '@/features/shared/theme';
import { useAuthUser } from '@/features/shared/auth';
import {
  useConnection,
  useDrivingEvents,
  useLastPacketAt,
  useLastPoint,
  useLiveStatus,
  useRoute,
  useTelemetryStore,
  type ConnectionState,
} from '@/features/shared/realtime';
import { WS_URL } from '@/lib/api/config';
import { useVehicles } from '@/features/vehicles/hooks';

type NavId = 'dashboard' | 'map' | 'trips' | 'vehicles' | 'devices' | 'demo' | 'settings';

interface DesktopShellProps {
  active?: NavId;
  onNav?: (id: NavId) => void;
  children: React.ReactNode;
}

/** Rótulo + cor do estado da conexão WebSocket. */
function connInfo(c: ConnectionState): { label: string; tone: string } {
  switch (c) {
    case 'live': return { label: 'LIVE', tone: SD.success };
    case 'reconnecting': return { label: 'RECONECTANDO', tone: SD.warning };
    case 'polling': return { label: 'POLLING', tone: SD.warning };
    case 'connecting': return { label: 'CONECTANDO', tone: SD.textDim };
    default: return { label: 'OFFLINE', tone: SD.danger };
  }
}

export function DesktopShell({ active = 'dashboard', onNav, children }: DesktopShellProps) {
  const tripId = useTelemetryStore((s) => s.tripId);
  const last = useLastPoint();
  const connection = useConnection();
  const { online } = useLiveStatus();
  const events = useDrivingEvents();
  const route = useRoute();
  const lastPacketAt = useLastPacketAt();
  const { data: vehicles } = useVehicles();
  const vehicle = vehicles?.[0];

  const conn = connInfo(connection);
  const sat = last?.satellites;

  // Relógio UTC ao vivo + idade do último pacote. Começa vazio para não divergir
  // entre SSR e cliente (hidratação); tica a cada 1s no cliente.
  const [clock, setClock] = useState('');
  const [packetAge, setPacketAge] = useState<string>('—');
  useEffect(() => {
    const tick = () => {
      setClock(new Date().toISOString().slice(11, 19));
      setPacketAge(lastPacketAt ? `${((Date.now() - lastPacketAt) / 1000).toFixed(1)}s` : '—');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastPacketAt]);

  const navItems: { id: NavId; label: string; icon: (s?: number) => React.ReactElement }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Icon.pulse },
    { id: 'map', label: 'Mapa', icon: Icon.map },
    { id: 'trips', label: 'Viagens', icon: Icon.arrow },
    { id: 'vehicles', label: 'Veículos', icon: Icon.car },
    { id: 'devices', label: 'Dispositivos', icon: Icon.chip },
    { id: 'demo', label: 'Demo ExpoIOT', icon: Icon.flag },
    { id: 'settings', label: 'Conta', icon: Icon.gear },
  ];

  return (
    <div
      className="sd-root sd-scan"
      style={{
        width: '100%', height: '100%', display: 'grid',
        gridTemplateColumns: '220px 1fr', gridTemplateRows: '56px 1fr 28px',
        background: SD.bg,
      }}
    >
      {/* Top bar */}
      <div style={{
        gridColumn: '1 / -1', display: 'flex', alignItems: 'center',
        borderBottom: `1px solid ${SD.border}`, background: SD.surface,
      }}>
        <div style={{ width: 220, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10, borderRight: `1px solid ${SD.border}`, height: '100%' }}>
          <Logo />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Tag tone={online ? 'cyan' : 'neutral'}>
              <Dot tone={online ? 'cyan' : 'gray'} size={6} /> {tripId ? `SESSÃO · ${tripId}` : 'SEM SESSÃO'}
            </Tag>
            <span className="sd-mono" style={{ fontSize: 11, color: SD.textDim }}>
              {route.length} pts <span style={{ color: SD.textMute }}>·</span> {events.length} eventos
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <StatusItem
              icon={Icon.sat(13)}
              value={typeof sat === 'number' ? `${sat} SAT` : '— SAT'}
              tone={typeof sat === 'number' && sat > 0 ? SD.success : SD.textDim}
            />
            <StatusItem icon={Icon.wifi(13)} value={`WS · ${conn.label}`} tone={conn.tone} />
            <StatusItem
              icon={Icon.chip(13)}
              value={online ? 'ONLINE' : 'OFFLINE'}
              tone={online ? SD.success : SD.danger}
            />
            <div style={{ width: 1, height: 22, background: SD.border }} />
            <ThemeToggle size="sm" />
            <Avatar />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{
        gridColumn: 1, gridRow: 2, borderRight: `1px solid ${SD.border}`,
        background: SD.surface, display: 'flex', flexDirection: 'column',
      }}>
        <div className="sd-label" style={{ fontSize: 9, padding: '18px 20px 8px' }}>Navegação</div>
        {navItems.map((n) => {
          const isActive = active === n.id;
          return (
            <div
              key={n.id}
              onClick={() => onNav && onNav(n.id)}
              className="sd-btn sd-hover-row"
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
                color: isActive ? SD.text : SD.textDim,
                background: isActive ? SD.surface2 : 'transparent',
                borderLeft: `3px solid ${isActive ? SD.primary : 'transparent'}`,
                fontSize: 13, fontWeight: isActive ? 600 : 500,
              }}
            >
              <span style={{ color: isActive ? SD.primary : SD.textDim }}>{n.icon(15)}</span>
              {n.label}
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ padding: 16, borderTop: `1px solid ${SD.border}` }}>
          <div className="sd-label" style={{ fontSize: 9, marginBottom: 8 }}>Veículo ativo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: SD.surface2, border: `1px solid ${SD.border}`,
              display: 'grid', placeItems: 'center', color: SD.primary,
            }}>
              {Icon.car(16)}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Nenhum veículo'}
              </div>
              <div className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>
                {vehicle
                  ? `${vehicle.baseMixedConsumptionKmL.toFixed(1)} km/L · ${vehicle.tankCapacityLiters.toFixed(0)} L`
                  : 'cadastre em Veículos'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ gridColumn: 2, gridRow: 2, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>

      {/* Footer status strip */}
      <div
        style={{
          gridColumn: '1 / -1', borderTop: `1px solid ${SD.border}`,
          background: SD.surface, display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 18, fontSize: 10, color: SD.textDim,
        }}
        className="sd-mono"
      >
        <span><Dot tone={online ? 'green' : 'gray'} size={6} pulse={false} /> {(WS_URL || 'ws://—').toUpperCase()}</span>
        <span>CONEXÃO {conn.label}</span>
        <span>ÚLT. PACOTE {packetAge}</span>
        <span>PONTOS {route.length}</span>
        <span>EVENTOS {events.length}</span>
        <span style={{ marginLeft: 'auto' }}>v0.4.1-mvp</span>
        <span>UTC {clock || '--:--:--'}</span>
      </div>
    </div>
  );
}

function Logo() {
  // Marca oficial conforme o tema (branca no dark, completa no light).
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <BrandLogo height={26} />
    </div>
  );
}

function StatusItem({ icon, value, tone }: { icon: React.ReactNode; value: string; tone?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: tone || SD.textDim }} className="sd-mono">
      {icon}
      <span style={{ fontSize: 11, letterSpacing: '0.04em' }}>{value}</span>
    </div>
  );
}

/** Iniciais do usuário autenticado. Sem sessão real, não renderiza nada (auditoria D-001). */
function Avatar() {
  const user = useAuthUser();
  if (!user) return null;
  const source = user.name?.trim() || user.email?.trim() || '';
  const initials = source
    ? source.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';
  return (
    <div title={user.name || user.email || undefined} style={{
      width: 30, height: 30, background: SD.primaryDeep, color: SD.text,
      display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12,
      border: `1.5px solid ${SD.borderBright}`,
    }}>
      {initials}
    </div>
  );
}
