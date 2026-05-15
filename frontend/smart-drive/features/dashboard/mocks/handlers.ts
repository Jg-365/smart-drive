import { http, HttpResponse } from 'msw'
import { makeTelemetryPoint, makeTelemetryStream } from './factories'

export const dashboardHandlers = [
  http.get('/api/telemetry/live', () => {
    return HttpResponse.json(makeTelemetryPoint())
  }),

  http.get('/api/trips/:id/telemetry', ({ params, request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') ?? '50', 10)
    const tripId = params.id as string
    const points = makeTelemetryStream(pageSize, tripId)
    return HttpResponse.json({
      data: points,
      page,
      pageSize,
      total: pageSize * 3,
    })
  }),
]
