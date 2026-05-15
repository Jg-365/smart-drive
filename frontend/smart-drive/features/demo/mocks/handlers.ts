import { http, HttpResponse } from 'msw'
import { normalDrivingScenario } from './factories'

let currentScenario = normalDrivingScenario()
let sessionId = 'demo-session-001'

export const demoHandlers = [
  http.post('/api/demo/start', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { scenario?: string }
    sessionId = `demo-session-${Date.now()}`
    currentScenario = normalDrivingScenario()
    return HttpResponse.json({
      sessionId,
      tripId: currentScenario.tripId,
      scenario: body.scenario ?? 'normal',
      startedAt: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.post('/api/demo/reset', () => {
    currentScenario = normalDrivingScenario()
    sessionId = 'demo-session-001'
    return HttpResponse.json({ reset: true, sessionId })
  }),

  http.get('/api/demo/current', () => {
    return HttpResponse.json({
      sessionId,
      tripId: currentScenario.tripId,
      telemetryPointCount: currentScenario.telemetryPoints.length,
      eventCount: currentScenario.drivingEvents.length,
      fuelEstimate: currentScenario.fuelEstimate,
    })
  }),
]
