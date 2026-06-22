import type { MetadataRoute } from 'next'

/**
 * Web App Manifest (PWA) — servido em /manifest.webmanifest e linkado
 * automaticamente pelo Next no <head>. Torna o app instalável (Android/iOS) com
 * tela cheia e identidade SmartDrive (HQ-dark). Ícones em SVG (app/icon.svg e os
 * logos em /public); navegadores Chromium aceitam SVG para instalação.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SmartDrive — Telemetria',
    short_name: 'SmartDrive',
    description: 'Telemetria veicular em tempo real: dashboard, mapa e relatórios.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0A0A0F',
    theme_color: '#0A0A0F',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
