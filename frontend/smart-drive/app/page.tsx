'use client';

import React, { useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';

import { TelemetryProvider, useTelemetryStore } from '@/features/shared/realtime';
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
import { LoginScreen, SettingsPage } from '@/features/auth';
import { useIsAuthenticated } from '@/features/shared/auth';
import { MobileShell, MobileTopBar } from '@/features/shell';
import { useIsMobile } from '@/features/shared/ui/useIsMobile';

type DesktopScreen = 'dashboard' | 'map' | 'trips' | 'vehicles' | 'devices' | 'demo' | 'settings';
type MobileTab = 'home' | 'live' | 'map' | 'trips' | 'menu';

// Viagem assinada em dev (casa com o sessionId do tools/telemetry-feeder). Sem a
// env, fica null → dashboard mostra estado vazio (default seguro para produção,
// até existir seleção de viagem real / modo demo).
const DEV_TRIP_ID = process.env.NEXT_PUBLIC_DEV_TRIP_ID ?? null;

/**
 * Liga o TelemetryProvider à viagem ATIVA do store (definida pelo Modo Demo ou
 * por uma viagem real), caindo para a viagem de dev quando não há nenhuma. Assim
 * o socket re-assina a sala da viagem certa quando o usuário inicia a demo/viagem
 * (resolve a dívida do EPIC-09: o provider assinava um tripId fixo). Como é um
 * selector atômico do store, só re-renderiza ao trocar de viagem.
 */
function RealtimeBridge({ children }: { children: React.ReactNode }) {
  const activeTripId = useTelemetryStore((s) => s.tripId);
  return (
    <TelemetryProvider tripId={activeTripId ?? DEV_TRIP_ID}>
      {children}
    </TelemetryProvider>
  );
}

export default function Page() {
  return (
    <QueryProvider>
      <AuthGate />
    </QueryProvider>
  );
}

/** Porta de entrada: sem sessão mostra o login; com sessão, monta o app. */
function AuthGate() {
  const isAuthed = useIsAuthenticated();
  if (!isAuthed) return <LoginScreen />;
  return (
    <RealtimeBridge>
      <AppShell />
    </RealtimeBridge>
  );
}

function AppShell() {
  const isMobile = useIsMobile();
  const [desktopScreen, setDesktopScreen] = useState<DesktopScreen>('dashboard');
  const [mobileTab, setMobileTab] = useState<MobileTab>('live');
  const [mobileSettings, setMobileSettings] = useState(false);
  const [demoMode, setDemoMode] = useState<'smooth' | 'normal' | 'aggressive'>('aggressive');

  const renderDesktopScreen = () => {
    switch (desktopScreen) {
      case 'dashboard': return <DashboardPage onNavigate={setDesktopScreen} />;
      case 'map': return <DesktopMapPage />;
      case 'trips': return <TripsPage />;
      case 'vehicles': return <VehiclesPage />;
      case 'devices': return <DevicesPage />;
      case 'demo': return <DemoPage mode={demoMode} onMode={setDemoMode} />;
      case 'settings': return <SettingsPage />;
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: SD.bg, position: 'relative' }}>
      {/* Layout escolhido automaticamente pela viewport (sem switch manual — UI-A02). */}
      {isMobile ? (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          <MobileScreenWrapper
            tab={mobileTab}
            onNav={(t) => { setMobileSettings(false); setMobileTab(t); }}
            showSettings={mobileSettings}
            onOpenSettings={() => setMobileSettings(true)}
            onCloseSettings={() => setMobileSettings(false)}
          />
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
  );
}

function MobileScreenWrapper({
  tab,
  onNav,
  showSettings,
  onOpenSettings,
  onCloseSettings,
}: {
  tab: MobileTab;
  onNav: (t: MobileTab) => void;
  showSettings: boolean;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
}) {
  if (showSettings) {
    return (
      <MobileShell active="home" onNav={onNav}>
        <MobileTopBar title="CONTA" onBack={onCloseSettings} />
        <SettingsPage />
      </MobileShell>
    );
  }
  switch (tab) {
    case 'home': return <MobileHomePage onNavigate={onNav} onSettings={onOpenSettings} />;
    case 'live': return <MobileLivePage onNavigate={onNav} />;
    case 'map': return <MapPage onBack={() => onNav('live')} />;
    case 'trips': return <MobileTripReportPage onNavigate={onNav} />;
    case 'menu': return <MobileDemoPage onNavigate={onNav} />;
    default: return <MobileLivePage onNavigate={onNav} />;
  }
}
