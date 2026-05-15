import { http, HttpResponse } from 'msw'
import type { Trip } from '@/features/shared/types'
import { TripStatus } from '@/features/shared/types'
import { makeTrip, makeTripList, makeTripSummary } from './factories'
import { makeDrivingEvent } from '@/features/dashboard/mocks/factories'

const db: Map<string, Trip> = new Map()

function seed() {
  if (db.size === 0) {
    makeTripList(8).forEach((t) => db.set(t.id, t))
  }
}

export const tripHandlers = [
  http.get('/api/trips', ({ request }) => {
    seed()
    const url = new URL(request.url)
    const vehicleId = url.searchParams.get('vehicleId')
    let trips = Array.from(db.values())
    if (vehicleId) trips = trips.filter((t) => t.vehicleId === vehicleId)
    return HttpResponse.json(trips)
  }),

  http.get('/api/trips/:id', ({ params }) => {
    seed()
    const trip = db.get(params.id as string)
    if (!trip) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json(trip)
  }),

  http.get('/api/trips/:id/summary', ({ params }) => {
    seed()
    const tripId = params.id as string
    const existing = db.get(tripId)
    if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json(makeTripSummary(tripId))
  }),

  http.post('/api/trips/start', async ({ request }) => {
    seed()
    const body = (await request.json()) as Partial<Trip>
    const trip = makeTrip({ ...body, status: TripStatus.ACTIVE, endedAt: undefined })
    db.set(trip.id, trip)
    return HttpResponse.json(trip, { status: 201 })
  }),

  http.post('/api/trips/:id/finish', ({ params }) => {
    seed()
    const existing = db.get(params.id as string)
    if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const finished = { ...existing, status: TripStatus.FINISHED, endedAt: new Date().toISOString() }
    db.set(finished.id, finished)
    return HttpResponse.json(finished)
  }),

  http.get('/api/trips/:id/events', ({ params }) => {
    seed()
    const tripId = params.id as string
    const existing = db.get(tripId)
    if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const events = Array.from({ length: 4 }, (_, i) =>
      makeDrivingEvent({ tripId, id: `event-${String(i + 1).padStart(3, '0')}` })
    )
    return HttpResponse.json(events)
  }),

  http.get('/api/trips/:id/route', ({ params }) => {
    seed()
    const existing = db.get(params.id as string)
    if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const route = Array.from({ length: 20 }, (_, i) => ({
      lat: -3.7318 + i * 0.0005,
      lng: -38.5213 + i * 0.0003,
    }))
    return HttpResponse.json(route)
  }),
]
