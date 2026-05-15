'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';

type MobileTab = 'home' | 'live' | 'map' | 'trips' | 'menu';

interface MobileShellProps {
  active?: MobileTab;
  onNav?: (id: MobileTab) => void;
  children: React.ReactNode;
  title?: string;
  scroll?: boolean;
  hideBars?: boolean;
  onBack?: () => void;
}

export function MobileShell({ active = 'live', onNav, children, title, scroll = true, hideBars = false, onBack }: MobileShellProps) {
  return (
    <div style={{ width: '100%', height: '100%', background: SD.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MobileStatusBar />
      {title && <MobileTopBar title={title} onBack={onBack} />}
      <div style={{ flex: 1, overflow: scroll ? 'auto' : 'hidden', position: 'relative' }}>
        {children}
      </div>
      {!hideBars && <MobileTabBar active={active} onNav={onNav} />}
    </div>
  );
}

export function MobileStatusBar() {
  return (
    <div style={{
      height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', color: SD.text, fontFamily: SD.fontMono, fontSize: 13, fontWeight: 600,
      flexShrink: 0,
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <rect x="0.5" y="0.5" width="2" height="9" rx="0.5" fill="currentColor" />
          <rect x="4.5" y="2.5" width="2" height="7" rx="0.5" fill="currentColor" />
          <rect x="8.5" y="4.5" width="2" height="5" rx="0.5" fill="currentColor" />
          <rect x="12.5" y="6.5" width="2" height="3" rx="0.5" fill="currentColor" opacity="0.4" />
        </svg>
        {Icon.wifi(13)}
        <svg width="22" height="10" viewBox="0 0 22 10">
          <rect x="0.5" y="0.5" width="18" height="9" rx="1.5" fill="none" stroke="currentColor" />
          <rect x="20" y="3" width="1.5" height="4" fill="currentColor" />
          <rect x="2" y="2" width="13" height="6" rx="0.5" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

export function MobileTopBar({ title, onBack, action }: { title: string; onBack?: () => void; action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 18px 14px', borderBottom: `1px solid ${SD.border}`, background: SD.surface,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack !== undefined && (
          <span className="sd-btn" style={{ color: SD.textDim }} onClick={onBack}>
            {Icon.back(18)}
          </span>
        )}
        <span className="sd-display" style={{ fontSize: 18 }}>{title}</span>
      </div>
      {action || <span className="sd-btn" style={{ color: SD.textDim }}>{Icon.more(18)}</span>}
    </div>
  );
}

export function MobileTabBar({ active, onNav }: { active?: MobileTab; onNav?: (id: MobileTab) => void }) {
  const items: { id: MobileTab; label: string; icon: (s?: number) => React.ReactElement }[] = [
    { id: 'home', label: 'Início', icon: Icon.pulse },
    { id: 'live', label: 'Ao vivo', icon: Icon.speed },
    { id: 'map', label: 'Mapa', icon: Icon.map },
    { id: 'trips', label: 'Viagens', icon: Icon.flag },
    { id: 'menu', label: 'Menu', icon: Icon.more },
  ];

  return (
    <div style={{
      borderTop: `1px solid ${SD.border}`, background: SD.surface,
      display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`,
      padding: '8px 0 22px', flexShrink: 0,
    }}>
      {items.map((it) => {
        const isActive = active === it.id;
        const c = isActive ? SD.primary : SD.textDim;
        return (
          <div
            key={it.id}
            onClick={() => onNav && onNav(it.id)}
            className="sd-btn"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: c, padding: '6px 0' }}
          >
            <div style={{ position: 'relative' }}>
              {it.icon(20)}
              {isActive && (
                <div style={{
                  position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                  width: 18, height: 2, background: SD.primary,
                }} />
              )}
            </div>
            <span className="sd-label" style={{ fontSize: 8, color: c, letterSpacing: '0.08em' }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}
