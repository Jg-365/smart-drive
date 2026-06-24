'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag } from '@/features/shared/ui/primitives';

type MobileTab = 'home' | 'live' | 'map' | 'trips' | 'menu';
type MobileSub = 'demo' | 'vehicles' | 'devices' | 'settings';

export function MobileMenuPage({
  onOpenSub,
}: {
  onOpenSub: (sub: MobileSub) => void;
  onNavigate?: (tab: MobileTab) => void;
}) {
  const items: {
    id: MobileSub;
    title: string;
    subtitle: string;
    icon: (size?: number, color?: string) => React.ReactElement;
  }[] = [
    { id: 'demo', title: 'Modo Demo', subtitle: 'ExpoIOT, perfis e reset rápido', icon: Icon.play },
    { id: 'vehicles', title: 'Meu veículo', subtitle: 'Cadastro, consumo e calibração', icon: Icon.car },
    { id: 'devices', title: 'Dispositivos / Parear', subtitle: 'ESP32, Wi-Fi e status ao vivo', icon: Icon.wifi },
    { id: 'settings', title: 'Conta', subtitle: 'Perfil, tema e sessão', icon: Icon.gear },
  ];

  return (
    <div style={{ padding: '18px 18px 24px', display: 'grid', gap: 14 }}>
      <div>
        <Tag tone="cyan">SMARTDRIVE</Tag>
        <div className="sd-display" style={{ fontSize: 24, lineHeight: 1.05, marginTop: 10 }}>MENU</div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="sd-btn"
            onClick={() => onOpenSub(item.id)}
            style={{
              width: '100%',
              minHeight: 64,
              display: 'grid',
              gridTemplateColumns: '42px 1fr auto',
              gap: 12,
              alignItems: 'center',
              padding: 14,
              background: SD.surface,
              border: `1.5px solid ${SD.border}`,
              color: SD.text,
              textAlign: 'left',
            }}
          >
            <span style={{
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              background: SD.surface2,
              border: `1px solid ${SD.border}`,
              color: SD.primary,
            }}>
              {item.icon(18)}
            </span>
            <span>
              <span className="sd-label" style={{ fontSize: 10, color: SD.text }}>{item.title}</span>
              <span className="sd-mono" style={{ display: 'block', fontSize: 11, color: SD.textDim, marginTop: 4 }}>
                {item.subtitle}
              </span>
            </span>
            <span style={{ color: SD.textDim }}>{Icon.arrow(14)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
