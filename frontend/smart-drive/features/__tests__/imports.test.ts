import { describe, it, expect } from 'vitest';
import { sdVars } from '@/lib/sd-vars';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { DesktopShell } from '@/features/shell';
import { MobileShell } from '@/features/shell';
import { DashboardPage } from '@/features/dashboard';
import { MobileLivePage } from '@/features/dashboard';
import { VehiclesPage } from '@/features/vehicles';
import { TripReportPage } from '@/features/trips';
import { MobileTripReportPage } from '@/features/trips';
import { DevicesPage } from '@/features/devices';
import { DemoPage } from '@/features/demo';
import { MobileDemoPage } from '@/features/demo';
import { MapPage } from '@/features/map';
import { MobileHomePage } from '@/features/home';

describe('sdVars', () => {
  it('sdVars.bg is var(--sd-bg)', () => {
    expect(sdVars.bg).toBe('var(--sd-bg)');
  });

  it('sdVars.primary is var(--sd-primary)', () => {
    expect(sdVars.primary).toBe('var(--sd-primary)');
  });

  it('alias SD.bg returns var(--sd-bg)', () => {
    expect(SD.bg).toBe('var(--sd-bg)');
  });
});

describe('features/shared/ui/icons', () => {
  it('Icon is an object', () => {
    expect(typeof Icon).toBe('object');
    expect(Icon).not.toBeNull();
  });

  it('Icon.speed is a function', () => {
    expect(typeof Icon.speed).toBe('function');
  });
});

describe('features/shell', () => {
  it('DesktopShell is defined', () => {
    expect(DesktopShell).toBeDefined();
  });

  it('MobileShell is defined', () => {
    expect(MobileShell).toBeDefined();
  });
});

describe('features/dashboard', () => {
  it('DashboardPage is defined', () => {
    expect(DashboardPage).toBeDefined();
  });

  it('MobileLivePage is defined', () => {
    expect(MobileLivePage).toBeDefined();
  });
});

describe('features/vehicles', () => {
  it('VehiclesPage is defined', () => {
    expect(VehiclesPage).toBeDefined();
  });
});

describe('features/trips', () => {
  it('TripReportPage is defined', () => {
    expect(TripReportPage).toBeDefined();
  });

  it('MobileTripReportPage is defined', () => {
    expect(MobileTripReportPage).toBeDefined();
  });
});

describe('features/devices', () => {
  it('DevicesPage is defined', () => {
    expect(DevicesPage).toBeDefined();
  });
});

describe('features/demo', () => {
  it('DemoPage is defined', () => {
    expect(DemoPage).toBeDefined();
  });

  it('MobileDemoPage is defined', () => {
    expect(MobileDemoPage).toBeDefined();
  });
});

describe('features/map', () => {
  it('MapPage is defined', () => {
    expect(MapPage).toBeDefined();
  });
});

describe('features/home', () => {
  it('MobileHomePage is defined', () => {
    expect(MobileHomePage).toBeDefined();
  });
});
