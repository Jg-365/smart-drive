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

  http.patch('/api/devices/:id', async ({ params, request }) => {
    seed()
    const existing = db.get(params.id as string)
    if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const body = (await request.json()) as Partial<Device>
    const updated = { ...existing, ...body }
    db.set(updated.id, updated)
    return HttpResponse.json(updated)
  }),

  http.post('/api/devices/:id/pair', async ({ params, request }) => {
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
