import { http, HttpResponse } from 'msw'
import type { Device } from '@/features/shared/types'
import { DeviceStatus } from '@/features/shared/types'
import { makeDevice, makeDeviceList } from './factories'

const db: Map<string, Device> = new Map()

function seed() {
  if (db.size === 0) {
    makeDeviceList(3).forEach((d) => db.set(d.id, d))
  }
}

export const deviceHandlers = [
  http.get('/api/devices', () => {
    seed()
    return HttpResponse.json(Array.from(db.values()))
  }),

  http.get('/api/devices/:id', ({ params }) => {
    seed()
    const device = db.get(params.id as string)
    if (!device) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json(device)
  }),

  http.post('/api/devices', async ({ request }) => {
    seed()
    const body = (await request.json()) as Partial<Device>
    if (!body.deviceCode || !body.name || !body.vehicleId) {
      return HttpResponse.json({ error: 'Invalid device' }, { status: 400 })
    }
    const duplicated = Array.from(db.values()).find((d) => d.deviceCode === body.deviceCode)
    if (duplicated) {
      return HttpResponse.json({ error: 'Duplicated device' }, { status: 409 })
    }
    const created: Device = {
      id: `device-${String(db.size + 1).padStart(3, '0')}`,
      deviceCode: body.deviceCode,
      name: body.name,
      firmwareVersion: body.firmwareVersion ?? 'v0.1.0',
      vehicleId: body.vehicleId,
      status: DeviceStatus.PAIRING,
      lastSeenAt: new Date().toISOString(),
    }
    db.set(created.id, created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch('/api/devices/:id', async ({ params, request }) => {
    seed()
    const existing = db.get(params.id as string)
    if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const body = (await request.json()) as Partial<Device>
    const updated = { ...existing, ...body }
    db.set(updated.id, updated)
    return HttpResponse.json(updated)
  }),

  http.patch('/api/devices/:id/pair', async ({ params, request }) => {
    seed()
    const existing = db.get(params.id as string)
    if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const body = (await request.json()) as { vehicleId?: string }
    const paired = {
      ...existing,
      status: DeviceStatus.ONLINE,
      vehicleId: body.vehicleId ?? existing.vehicleId,
      lastSeenAt: new Date().toISOString(),
    }
    db.set(paired.id, paired)
    return HttpResponse.json(paired)
  }),
]
