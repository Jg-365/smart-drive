'use client';

import React, { useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';

import { TelemetryProvider } from '@/features/shared/realtime';
import { QueryProvider } from '@/features/shared/query';
import { DesktopShell } from '@/features/shell';
import { DashboardPage } from '@/features/dashboard';
import { TripsPage } from '@/features/trips';
import { VehiclesPage } from '@/features/vehicles';
import { DevicesPage } from '@/features/devices';
import { DemoPage } from '@/features/demo';

import { MobileHomePage } from '@/features/home';
import { MobileLivePage } from '@/features/dashboard';
import { MapPage, DesktopMapPage } from '@/features/map';
import { MobileTripReportPage } from '@/features/trips';
import { MobileDemoPage } from '@/features/demo';
import { useIsMobile } from '@/features/shared/ui/useIsMobile';

type DesktopScreen = 'dashboard' | 'map' | 'trips' | 'vehicles' | 'devices' | 'demo';
type MobileTab = 'home' | 'live' | 'map' | 'trips' | 'menu';

// Viagem assinada em dev (casa com o sessionId do tools/telemetry-feeder). Sem a
// env, fica null → dashboard mostra estado vazio (default seguro para produção,
// até existir seleção de viagem real / modo demo).
const DEV_TRIP_ID = process.env.NEXT_PUBLIC_DEV_TRIP_ID ?? null;

export default function Page() {
  const isMobile = useIsMobile();
  const [desktopScreen, setDesktopScreen] = useState<DesktopScreen>('dashboard');
  const [mobileTab, setMobileTab] = useState<MobileTab>('live');
  const [demoMode, setDemoMode] = useState<'smooth' | 'normal' | 'aggressive'>('aggressive');

  const renderDesktopScreen = () => {
    switch (desktopScreen) {
      case 'dashboard': return <DashboardPage onNavigate={setDesktopScreen} />;
      case 'map': return <DesktopMapPage />;
      case 'trips': return <TripsPage />;
      case 'vehicles': return <VehiclesPage />;
      case 'devices': return <DevicesPage />;
      case 'demo': return <DemoPage mode={demoMode} onMode={setDemoMode} />;
    }
  };

  return (
    <QueryProvider>
    <TelemetryProvider tripId={DEV_TRIP_ID}>
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: SD.bg, position: 'relative' }}>
      {/* Layout escolhido automaticamente pela viewport (sem switch manual — UI-A02). */}
      {isMobile ? (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          <MobileScreenWrapper tab={mobileTab} onNav={setMobileTab} />
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%' }}>
          <DesktopShell
            active={desktopScreen}
            onNav={(id) => setDesktopScreen(id as DesktopScreen)}
          >
            {renderDesktopScreen()}
          </DesktopShell>
        </div>
      )}
    </div>
    </TelemetryProvider>
    </QueryProvider>
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
    case 'home': return <MobileHomePage onNavigate={onNav} />;
    case 'live': return <MobileLivePage onNavigate={onNav} />;
    case 'map': return <MapPage onBack={() => onNav('live')} />;
    case 'trips': return <MobileTripReportPage />;
    case 'menu': return <MobileDemoPage />;
    default: return <MobileLivePage onNavigate={onNav} />;
  }
}
