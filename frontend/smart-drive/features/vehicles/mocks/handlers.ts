import { http, HttpResponse } from 'msw'
import type { Vehicle } from '@/features/shared/types'
import { makeVehicle, makeVehicleList } from './factories'

const db: Map<string, Vehicle> = new Map()

function seed() {
  if (db.size === 0) {
    makeVehicleList(4).forEach((v) => db.set(v.id, v))
  }
}

export const vehicleHandlers = [
  http.get('/api/vehicles', () => {
    seed()
    return HttpResponse.json(Array.from(db.values()))
  }),

  http.post('/api/vehicles', async ({ request }) => {
    seed()
    const body = (await request.json()) as Partial<Vehicle>
    const vehicle = makeVehicle(body)
    db.set(vehicle.id, vehicle)
    return HttpResponse.json(vehicle, { status: 201 })
  }),

  http.get('/api/vehicles/:id', ({ params }) => {
    seed()
    const vehicle = db.get(params.id as string)
    if (!vehicle) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json(vehicle)
  }),

  http.patch('/api/vehicles/:id', async ({ params, request }) => {
    seed()
    const existing = db.get(params.id as string)
    if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const body = (await request.json()) as Partial<Vehicle>
    const updated = { ...existing, ...body }
    db.set(updated.id, updated)
    return HttpResponse.json(updated)
  }),

  http.delete('/api/vehicles/:id', ({ params }) => {
    seed()
    db.delete(params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),
]
