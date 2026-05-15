'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Dot } from '@/features/shared/ui/primitives';

type NavId = 'dashboard' | 'trips' | 'vehicles' | 'devices' | 'demo';

interface DesktopShellProps {
  active?: NavId;
  onNav?: (id: NavId) => void;
  children: React.ReactNode;
  deviceOnline?: boolean;
}

export function DesktopShell({ active = 'dashboard', onNav, children, deviceOnline = true }: DesktopShellProps) {
  const navItems: { id: NavId; label: string; icon: (s?: number) => React.ReactElement }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Icon.pulse },
    { id: 'trips', label: 'Viagens', icon: Icon.map },
    { id: 'vehicles', label: 'Veículos', icon: Icon.car },
    { id: 'devices', label: 'Dispositivos', icon: Icon.chip },
    { id: 'demo', label: 'Demo ExpoIOT', icon: Icon.flag },
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
            <Tag tone="cyan"><Dot tone="cyan" size={6} /> SESSÃO ATIVA · TRIP-2026-031</Tag>
            <span className="sd-mono" style={{ fontSize: 11, color: SD.textDim }}>
              esp32-demo-001 <span style={{ color: SD.textMute }}>·</span> FRT v0.4.1
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <StatusItem icon={Icon.sat(13)} value="8 SAT" tone={SD.success} />
            <StatusItem icon={Icon.wifi(13)} value="WS · 42 ms" tone={SD.success} />
            <StatusItem
              icon={Icon.chip(13)}
              value={deviceOnline ? 'ONLINE' : 'OFFLINE'}
              tone={deviceOnline ? SD.success : SD.danger}
            />
            <div style={{ width: 1, height: 22, background: SD.border }} />
            <div style={{ position: 'relative' }}>
              {Icon.bell(16, SD.textDim)}
              <span style={{ position: 'absolute', top: -3, right: -4, width: 7, height: 7, background: SD.danger, borderRadius: 999 }} />
            </div>
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
              <div style={{ fontSize: 12, fontWeight: 600 }}>Onix LT 1.0</div>
              <div className="sd-mono" style={{ fontSize: 10, color: SD.textDim }}>12.4 km/L · 44 L</div>
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
        <span><Dot tone="green" size={6} pulse={false} /> WSS://API.SMARTDRIVE.LOCAL/REALTIME</span>
        <span>RX 1.4 KB/S · TX 0.3 KB/S</span>
        <span>BUFFER 24/128</span>
        <span>DROP 0.00%</span>
        <span>QUEUE Q0:0 Q1:2 Q2:0</span>
        <span>WD HEALTHY</span>
        <span style={{ marginLeft: 'auto' }}>v0.4.1-mvp · build 2026.05.07</span>
        <span>UTC 17:42:03</span>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 26, height: 26 }}>
        <svg viewBox="0 0 26 26" width="26" height="26">
          <rect x="1" y="1" width="24" height="24" fill={SD.bg} stroke={SD.primary} strokeWidth="2" />
          <path d="M5 13 L11 8 L11 11 L21 11 L21 15 L11 15 L11 18 Z" fill={SD.primary} />
        </svg>
      </div>
      <div>
        <div className="sd-display" style={{ fontSize: 15, letterSpacing: '-0.01em' }}>SMARTDRIVE</div>
        <div className="sd-label" style={{ fontSize: 8, color: SD.textMute, marginTop: -2 }}>TELEMETRY · v0.4.1</div>
      </div>
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

function Avatar() {
  return (
    <div style={{
      width: 30, height: 30, background: SD.primaryDeep, color: SD.text,
      display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12,
      border: `1.5px solid ${SD.borderBright}`,
    }}>
      LC
    </div>
  );
}
