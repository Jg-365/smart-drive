import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { ApiError, api } from '../client'
import { fetchLiveTelemetry, fetchTripTelemetry } from '../telemetry'

describe('lib/api client', () => {
  it('fetchLiveTelemetry resolves a TelemetryPoint via MSW', async () => {
    const point = await fetchLiveTelemetry()
    expect(point).toMatchObject({
      id: expect.any(String),
      tripId: expect.any(String),
      lat: expect.any(Number),
      lng: expect.any(Number),
      speedKmh: expect.any(Number),
    })
  })

  it('fetchTripTelemetry returns a paginated stream with the requested pageSize', async () => {
    const res = await fetchTripTelemetry('trip-1', { page: 2, pageSize: 10 })
    expect(res.page).toBe(2)
    expect(res.pageSize).toBe(10)
    expect(res.data).toHaveLength(10)
    expect(res.data[0]).toHaveProperty('tripId', 'trip-1')
  })

  it('throws ApiError with status and parsed body on non-2xx', async () => {
    server.use(
      http.get('/api/telemetry/live', () =>
        HttpResponse.json({ error: 'boom' }, { status: 503 }),
      ),
    )
    await expect(fetchLiveTelemetry()).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      body: { error: 'boom' },
    })
    await expect(fetchLiveTelemetry()).rejects.toBeInstanceOf(ApiError)
  })

  it('serializes the body as JSON on POST', async () => {
    let received: unknown
    server.use(
      http.post('/api/echo', async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ ok: true })
      }),
    )
    await api.post('/api/echo', { hello: 'world' })
    expect(received).toEqual({ hello: 'world' })
  })
})
