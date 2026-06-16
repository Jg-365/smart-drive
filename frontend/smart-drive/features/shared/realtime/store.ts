import { create } from 'zustand'
import type {
  DeviceStatus,
  DrivingEvent,
  DrivingScore,
  FuelEstimate,
  TelemetryPoint,
} from '@/features/shared/types'
import { type LngLat, toLngLat } from '@/features/shared/geo'

/**
 * Estado da conexão de tempo real:
 * - connecting   → primeira tentativa de handshake
 * - live         → WebSocket conectado e recebendo
 * - reconnecting → caiu, tentando reconectar (dentro do limite de tentativas)
 * - polling      → esgotou as tentativas, operando via fallback HTTP
 * - offline      → desconectado e sem polling (pausado/desmontado)
 */
export type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'polling' | 'offline'

/** Máximo de eventos mantidos em memória (feed do dashboard). */
export const MAX_EVENTS = 100

export interface TelemetryState {
  tripId: string | null
  lastPoint: TelemetryPoint | null
  events: DrivingEvent[]
  score: DrivingScore | null
  fuelEstimate: FuelEstimate | null
  deviceStatus: DeviceStatus | null
  connection: ConnectionState
  /** Epoch ms do último ponto recebido — base para detectar offline por staleness. */
  lastPacketAt: number | null
  /** Rota acumulada da viagem ([lng, lat]); só pontos com coordenada válida. */
  route: LngLat[]
  tripFinished: boolean

  // actions — mutações atômicas, uma por tipo de evento WS
  setConnection: (c: ConnectionState) => void
  setTrip: (tripId: string | null) => void
  ingestPoint: (p: TelemetryPoint) => void
  addEvent: (e: DrivingEvent) => void
  setScore: (s: DrivingScore) => void
  setFuelEstimate: (f: FuelEstimate) => void
  setDeviceStatus: (d: DeviceStatus) => void
  markFinished: () => void
  reset: () => void
}

const initialState = {
  tripId: null as string | null,
  lastPoint: null as TelemetryPoint | null,
  events: [] as DrivingEvent[],
  score: null as DrivingScore | null,
  fuelEstimate: null as FuelEstimate | null,
  deviceStatus: null as DeviceStatus | null,
  connection: 'offline' as ConnectionState,
  lastPacketAt: null as number | null,
  route: [] as LngLat[],
  tripFinished: false,
}

export const useTelemetryStore = create<TelemetryState>()((set) => ({
  ...initialState,

  setConnection: (connection) => set({ connection }),
  setTrip: (tripId) => set({ tripId }),
  ingestPoint: (lastPoint) =>
    set((s) => {
      const coord = toLngLat(lastPoint)
      return {
        lastPoint,
        lastPacketAt: Date.now(),
        // coord inválida (GPS null/fora de range) é ignorada: a polyline não
        // ganha o ponto e o marcador "congela" no último válido (edge JOA-RF-04).
        route: coord ? [...s.route, coord] : s.route,
      }
    }),
  addEvent: (e) => set((s) => ({ events: [e, ...s.events].slice(0, MAX_EVENTS) })),
  setScore: (score) => set({ score }),
  setFuelEstimate: (fuelEstimate) => set({ fuelEstimate }),
  setDeviceStatus: (deviceStatus) => set({ deviceStatus }),
  markFinished: () => set({ tripFinished: true }),
  reset: () => set({ ...initialState }),
}))

// ── Selectors atômicos ───────────────────────────────────────────────
// Cada hook assina apenas uma fatia do estado: um novo ponto de telemetria
// não re-renderiza o card de score, o feed de eventos, etc. (JOA-RNF-01).
export const useConnection = () => useTelemetryStore((s) => s.connection)
export const useLastPoint = () => useTelemetryStore((s) => s.lastPoint)
export const useDrivingEvents = () => useTelemetryStore((s) => s.events)
export const useDrivingScore = () => useTelemetryStore((s) => s.score)
export const useFuelEstimate = () => useTelemetryStore((s) => s.fuelEstimate)
export const useDeviceStatus = () => useTelemetryStore((s) => s.deviceStatus)
export const useTripFinished = () => useTelemetryStore((s) => s.tripFinished)
export const useLastPacketAt = () => useTelemetryStore((s) => s.lastPacketAt)
export const useRoute = () => useTelemetryStore((s) => s.route)
