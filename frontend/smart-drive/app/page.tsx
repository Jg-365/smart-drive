'use client';

import React, { useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';

import { DesktopShell } from '@/features/shell';
import { DashboardPage } from '@/features/dashboard';
import { TripReportPage } from '@/features/trips';
import { VehiclesPage } from '@/features/vehicles';
import { DevicesPage } from '@/features/devices';
import { DemoPage } from '@/features/demo';

import { MobileHomePage } from '@/features/home';
import { MobileLivePage } from '@/features/dashboard';
import { MapPage } from '@/features/map';
import { MobileTripReportPage } from '@/features/trips';
import { MobileDemoPage } from '@/features/demo';

type AppMode = 'desktop' | 'mobile';
type DesktopScreen = 'dashboard' | 'trips' | 'vehicles' | 'devices' | 'demo';
type MobileTab = 'home' | 'live' | 'map' | 'trips' | 'menu';

export default function Page() {
  const [mode, setMode] = useState<AppMode>('desktop');
  const [desktopScreen, setDesktopScreen] = useState<DesktopScreen>('dashboard');
  const [mobileTab, setMobileTab] = useState<MobileTab>('live');
  const [demoMode, setDemoMode] = useState<'smooth' | 'normal' | 'aggressive'>('aggressive');

  const renderDesktopScreen = () => {
    switch (desktopScreen) {
      case 'dashboard': return <DashboardPage />;
      case 'trips': return <TripReportPage />;
      case 'vehicles': return <VehiclesPage />;
      case 'devices': return <DevicesPage />;
      case 'demo': return <DemoPage mode={demoMode} onMode={setDemoMode} />;
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: SD.bg, position: 'relative' }}>
      {/* Mode switcher */}
      <div style={{
        position: 'fixed', top: 0, right: 0, zIndex: 9999,
        display: 'flex', gap: 1, background: SD.surface2,
        border: `1px solid ${SD.border}`, borderTop: 'none', borderRight: 'none',
      }}>
        {(['desktop', 'mobile'] as AppMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="sd-label sd-btn"
            style={{
              padding: '6px 14px', fontSize: 9, letterSpacing: '0.12em',
              background: mode === m ? SD.primary : 'transparent',
              color: mode === m ? SD.bg : SD.textDim,
              border: 'none', cursor: 'pointer', fontWeight: 700,
            }}
          >
            {m === 'desktop' ? 'DESKTOP' : 'MOBILE'}
          </button>
        ))}
      </div>

      {/* Desktop mode */}
      {mode === 'desktop' && (
        <div style={{ width: '100%', height: '100%' }}>
          <DesktopShell
            active={desktopScreen}
            onNav={(id) => setDesktopScreen(id as DesktopScreen)}
          >
            {renderDesktopScreen()}
          </DesktopShell>
        </div>
      )}

      {/* Mobile mode */}
      {mode === 'mobile' && (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: SD.bg,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 3px)',
        }}>
          <div style={{
            width: 402, height: 780, position: 'relative',
            border: `2px solid ${SD.borderHi}`,
            borderRadius: 44,
            overflow: 'hidden',
            boxShadow: `0 0 0 1px ${SD.border}, 0 0 60px rgba(0,229,255,0.06), 0 24px 80px rgba(0,0,0,0.6)`,
            background: SD.bg,
          }}>
            {/* Notch */}
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              width: 120, height: 34, background: SD.bg, borderRadius: 20, zIndex: 10,
              border: `1px solid ${SD.borderHi}`,
            }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 42, overflow: 'hidden' }}>
              <MobileScreenWrapper
                tab={mobileTab}
                onNav={setMobileTab}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileScreenWrapper({
  tab,
  onNav,
}: {
  tab: MobileTab;
  onNav: (t: MobileTab) => void;
}) {
  switch (tab) {
    case 'home': return <MobileHomePage />;
    case 'live': return <MobileLivePage />;
    case 'map': return <MapPage />;
    case 'trips': return <MobileTripReportPage />;
    case 'menu': return <MobileDemoPage />;
    default: return <MobileLivePage />;
  }
}
