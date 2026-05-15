import { vehicleHandlers } from '@/features/vehicles/mocks/handlers'
import { tripHandlers } from '@/features/trips/mocks/handlers'
import { deviceHandlers } from '@/features/devices/mocks/handlers'
import { dashboardHandlers } from '@/features/dashboard/mocks/handlers'
import { demoHandlers } from '@/features/demo/mocks/handlers'

export const handlers = [
  ...vehicleHandlers,
  ...tripHandlers,
  ...deviceHandlers,
  ...dashboardHandlers,
  ...demoHandlers,
]
