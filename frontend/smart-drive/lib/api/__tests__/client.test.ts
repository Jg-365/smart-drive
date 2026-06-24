import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { ApiError, api } from '../client'
import { createDevice, pairDevice } from '../devices'
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

  it('pairDevice uses the backend PATCH contract', async () => {
    let method = ''
    let received: unknown
    server.use(
      http.patch('/api/devices/device-001/pair', async ({ request }) => {
        method = request.method
        received = await request.json()
        return HttpResponse.json({ id: 'device-001', vehicleId: 'vehicle-001' })
      }),
      http.post('/api/devices/device-001/pair', () =>
        HttpResponse.json({ error: 'wrong method' }, { status: 405 }),
      ),
    )
    await pairDevice('device-001', 'vehicle-001')
    expect(method).toBe('PATCH')
    expect(received).toEqual({ vehicleId: 'vehicle-001' })
  })

  it('createDevice posts the backend registration contract', async () => {
    let received: Record<string, unknown> | undefined
    server.use(
      http.post('/api/devices', async ({ request }) => {
        received = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 'device-001', ...received }, { status: 201 })
      }),
    )
    await createDevice({
      name: 'ESP32 Demo',
      deviceCode: 'esp32-demo-001',
      firmwareVersion: 'v0.1.0',
      vehicleId: 'vehicle-001',
    })
    expect(received).toEqual({
      name: 'ESP32 Demo',
      deviceCode: 'esp32-demo-001',
      firmwareVersion: 'v0.1.0',
      vehicleId: 'vehicle-001',
    })
  })
})
