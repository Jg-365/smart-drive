'use client'

import { useEffect, useState } from 'react'
import { DeviceStatus } from '@/features/shared/types'
import { useConnection, useDeviceStatus, useLastPacketAt } from './store'

/** Sem pacote por mais que isto → dispositivo considerado offline (JOA-RF-03). */
export const STALE_TIMEOUT_MS = 5000

/** Velocidade acima disto é tratada como dado inválido (edge case JOA-RF-03). */
export const MAX_VALID_SPEED_KMH = 300

export type LiveStatus = 'live' | 'reconnecting' | 'polling' | 'offline'

export interface LiveStatusInfo {
  status: LiveStatus
  online: boolean
}

/**
 * Status efetivo do dispositivo combinando o estado da conexão WS com a
 * "frescura" do último pacote: fica offline N segundos após o último ponto,
 * mesmo que o socket siga aberto, e volta para online sozinho quando os pacotes
 * voltam (edge: reconecta após offline). Tica a cada 1s para reavaliar o tempo.
 */
export function useLiveStatus(timeoutMs = STALE_TIMEOUT_MS): LiveStatusInfo {
  const connection = useConnection()
  const deviceStatus = useDeviceStatus()
  const lastPacketAt = useLastPacketAt()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const fresh = lastPacketAt != null && now - lastPacketAt < timeoutMs
  const online =
    connection === 'live' && fresh && deviceStatus !== DeviceStatus.OFFLINE

  let status: LiveStatus
  if (connection === 'reconnecting') status = 'reconnecting'
  else if (connection === 'polling') status = 'polling'
  else if (online) status = 'live'
  else status = 'offline'

  return { status, online }
}

/** Velocidade válida para exibição (número finito, não-negativo, ≤ máximo). */
export function isValidSpeed(speedKmh: number | null | undefined): speedKmh is number {
  return (
    typeof speedKmh === 'number' &&
    Number.isFinite(speedKmh) &&
    speedKmh >= 0 &&
    speedKmh <= MAX_VALID_SPEED_KMH
  )
}
