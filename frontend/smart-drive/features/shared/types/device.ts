export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  PAIRING = 'PAIRING',
  ERROR = 'ERROR',
}

export interface Device {
  id: string
  deviceCode: string
  name: string
  vehicleId: string
  firmwareVersion?: string | null
  lastSeenAt?: string | null
  status: DeviceStatus
}
