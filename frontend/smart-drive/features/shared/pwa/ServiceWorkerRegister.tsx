'use client'

import { useEffect } from 'react'

/**
 * Registra o service worker (/sw.js) no cliente para habilitar o PWA (instalável
 * + offline shell, EPIC-C3). Só em produção e quando o navegador suporta SW —
 * em dev o SW atrapalharia o HMR. Não renderiza nada.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // falha de registro não deve quebrar o app
      })
    }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}
