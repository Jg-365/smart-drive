export { api, ApiError } from './client'
export type { RequestOptions } from './client'
export { API_BASE_URL, WS_URL } from './config'
export { fetchLiveTelemetry, fetchTripTelemetry } from './telemetry'
export type { Paginated } from './telemetry'
export {
  fetchVehicles,
  fetchVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from './vehicles'
export type { CreateVehicleInput, UpdateVehicleInput } from './vehicles'
export { fetchTrips, fetchTripSummary, fetchTripRoute } from './trips'
export type { TripSummaryResponse, RoutePoint } from './trips'
export { startDemo, resetDemo, fetchCurrentDemo } from './demo'
export type { DemoProfile, DemoStartInput, DemoSession, DemoCurrent } from './demo'
export { fetchDevices, fetchDevice, pairDevice } from './devices'
