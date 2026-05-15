import type { Device } from '@/features/shared/types'

let deviceCounter = 0

const PRESET_DEVICES: Omit<Device, 'id'>[] = [
  {
    deviceCode: 'esp32-demo-001',
    name: 'SmartDrive Demo 001',
    vehicleId: 'vehicle-001',
    firmwareVersion: 'v0.4.1',
    lastSeenAt: '2024-03-10T08:32:00.000Z',
    status: 'ONLINE',
  },
  {
    deviceCode: 'esp32-backup-001',
    name: 'SmartDrive Backup 001',
    vehicleId: 'vehicle-002',
    firmwareVersion: 'v0.3.8',
    lastSeenAt: '2024-03-08T14:20:00.000Z',
    status: 'OFFLINE',
  },
  {
    deviceCode: 'esp32-test-002',
    name: 'SmartDrive Test 002',
    vehicleId: 'vehicle-003',
    firmwareVersion: 'v0.4.1',
    lastSeenAt: '2024-03-10T09:00:00.000Z',
    status: 'PAIRING',
  },
]

export function makeDevice(overrides?: Partial<Device>): Device {
  const index = deviceCounter % PRESET_DEVICES.length
  const preset = PRESET_DEVICES[index]
  const id = String(++deviceCounter).padStart(3, '0')

  return {
    id: `device-${id}`,
    ...preset,
    ...overrides,
  }
}

export function makeDeviceList(count = 3): Device[] {
  return Array.from({ length: count }, () => makeDevice())
}
