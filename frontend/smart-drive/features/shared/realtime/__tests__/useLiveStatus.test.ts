import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DeviceStatus } from '@/features/shared/types'
import type { TelemetryPoint } from '@/features/shared/types'
import { useTelemetryStore } from '../store'
import { MAX_VALID_SPEED_KMH, isValidSpeed, useLiveStatus } from '../useLiveStatus'

const point: TelemetryPoint = {
  id: 'p',
  tripId: 't',
  timestamp: 1,
  lat: 0,
  lng: 0,
  speedKmh: 10,
  accelX: 0,
  accelY: 0,
  accelZ: 9.8,
}

beforeEach(() => {
  vi.useFakeTimers()
  useTelemetryStore.getState().reset()
})
afterEach(() => vi.useRealTimers())

describe('useLiveStatus', () => {
  it('fica online ao receber pacote com conexão live', () => {
    const { result } = renderHook(() => useLiveStatus(5000))
    act(() => {
      useTelemetryStore.getState().setConnection('live')
      useTelemetryStore.getState().ingestPoint(point)
    })
    expect(result.current).toEqual({ status: 'live', online: true })
  })

  it('vai a offline após N segundos sem pacote, mesmo com socket aberto', () => {
    const { result } = renderHook(() => useLiveStatus(5000))
    act(() => {
      useTelemetryStore.getState().setConnection('live')
      useTelemetryStore.getState().ingestPoint(point)
    })
    expect(result.current.online).toBe(true)

    act(() => {
      vi.advanceTimersByTime(6000) // passa do timeout; o tick de 1s reavalia
    })
    expect(result.current).toEqual({ status: 'offline', online: false })
  })

  it('volta a online sozinho quando os pacotes voltam', () => {
    const { result } = renderHook(() => useLiveStatus(5000))
    act(() => {
      useTelemetryStore.getState().setConnection('live')
      useTelemetryStore.getState().ingestPoint(point)
      vi.advanceTimersByTime(6000)
    })
    expect(result.current.online).toBe(false)

    act(() => {
      useTelemetryStore.getState().ingestPoint(point)
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.online).toBe(true)
  })

  it('reflete reconnecting e polling da conexão', () => {
    const { result } = renderHook(() => useLiveStatus())
    act(() => useTelemetryStore.getState().setConnection('reconnecting'))
    expect(result.current.status).toBe('reconnecting')
    act(() => useTelemetryStore.getState().setConnection('polling'))
    expect(result.current.status).toBe('polling')
  })

  it('device:statusChanged OFFLINE força offline mesmo com pacote fresco', () => {
    const { result } = renderHook(() => useLiveStatus(5000))
    act(() => {
      useTelemetryStore.getState().setConnection('live')
      useTelemetryStore.getState().ingestPoint(point)
      useTelemetryStore.getState().setDeviceStatus(DeviceStatus.OFFLINE)
    })
    expect(result.current.online).toBe(false)
  })
})

describe('isValidSpeed', () => {
  it('aceita número finito em [0, máximo]', () => {
    expect(isValidSpeed(0)).toBe(true)
    expect(isValidSpeed(120)).toBe(true)
    expect(isValidSpeed(MAX_VALID_SPEED_KMH)).toBe(true)
  })

  it('rejeita null, negativo, acima do máximo e não-finito', () => {
    expect(isValidSpeed(null)).toBe(false)
    expect(isValidSpeed(undefined)).toBe(false)
    expect(isValidSpeed(-1)).toBe(false)
    expect(isValidSpeed(301)).toBe(false)
    expect(isValidSpeed(Infinity)).toBe(false)
  })
})
