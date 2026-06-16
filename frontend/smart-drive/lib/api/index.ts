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
