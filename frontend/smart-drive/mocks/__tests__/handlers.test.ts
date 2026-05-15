import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Vehicle handlers', () => {
  it('GET /api/vehicles returns 200 with array', async () => {
    const res = await fetch('/api/vehicles')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
  })

  it('POST /api/vehicles returns 201 with new vehicle', async () => {
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: 'Toyota', model: 'Corolla' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeTruthy()
    expect(body.brand).toBe('Toyota')
  })

  it('GET /api/vehicles/:id returns 200 for existing vehicle', async () => {
    const listRes = await fetch('/api/vehicles')
    const list = await listRes.json()
    const id = list[0].id

    const res = await fetch(`/api/vehicles/${id}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(id)
  })

  it('GET /api/vehicles/:id returns 404 for unknown vehicle', async () => {
    const res = await fetch('/api/vehicles/vehicle-does-not-exist')
    expect(res.status).toBe(404)
  })

  it('PATCH /api/vehicles/:id returns 200 with updated vehicle', async () => {
    const listRes = await fetch('/api/vehicles')
    const list = await listRes.json()
    const id = list[0].id

    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: 2025 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.year).toBe(2025)
  })

  it('DELETE /api/vehicles/:id returns 204', async () => {
    const listRes = await fetch('/api/vehicles')
    const list = await listRes.json()
    const id = list[0].id

    const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
    expect(res.status).toBe(204)
  })
})

describe('Trip handlers', () => {
  it('GET /api/trips returns 200 with array', async () => {
    const res = await fetch('/api/trips')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('GET /api/trips/:id returns 200 for existing trip', async () => {
    const listRes = await fetch('/api/trips')
    const list = await listRes.json()
    const id = list[0].id

    const res = await fetch(`/api/trips/${id}`)
    expect(res.status).toBe(200)
  })

  it('GET /api/trips/:id returns 404 for unknown trip', async () => {
    const res = await fetch('/api/trips/trip-does-not-exist')
    expect(res.status).toBe(404)
  })

  it('POST /api/trips/start returns 201', async () => {
    const res = await fetch('/api/trips/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId: 'vehicle-001' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.status).toBe('ACTIVE')
  })

  it('GET /api/trips/:id/events returns 200 with array', async () => {
    const listRes = await fetch('/api/trips')
    const list = await listRes.json()
    const id = list[0].id

    const res = await fetch(`/api/trips/${id}/events`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('GET /api/trips/:id/route returns 200 with coordinates', async () => {
    const listRes = await fetch('/api/trips')
    const list = await listRes.json()
    const id = list[0].id

    const res = await fetch(`/api/trips/${id}/route`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0]).toHaveProperty('lat')
    expect(body[0]).toHaveProperty('lng')
  })
})

describe('Device handlers', () => {
  it('GET /api/devices returns 200 with array', async () => {
    const res = await fetch('/api/devices')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('GET /api/devices/:id returns 404 for unknown device', async () => {
    const res = await fetch('/api/devices/device-does-not-exist')
    expect(res.status).toBe(404)
  })

  it('GET /api/devices/:id returns 200 for existing device', async () => {
    const listRes = await fetch('/api/devices')
    const list = await listRes.json()
    const id = list[0].id

    const res = await fetch(`/api/devices/${id}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(id)
  })
})

describe('Dashboard handlers', () => {
  it('GET /api/telemetry/live returns 200 with telemetry point', async () => {
    const res = await fetch('/api/telemetry/live')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBeTruthy()
    expect(body.speedKmh).toBeDefined()
  })

  it('GET /api/trips/:id/telemetry returns paginated data', async () => {
    const res = await fetch('/api/trips/trip-001/telemetry')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.page).toBeDefined()
  })
})

describe('Demo handlers', () => {
  it('POST /api/demo/start returns 201', async () => {
    const res = await fetch('/api/demo/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'normal' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.sessionId).toBeTruthy()
  })

  it('GET /api/demo/current returns 200', async () => {
    const res = await fetch('/api/demo/current')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tripId).toBeTruthy()
  })

  it('POST /api/demo/reset returns 200 with reset true', async () => {
    const res = await fetch('/api/demo/reset', { method: 'POST' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.reset).toBe(true)
  })
})
