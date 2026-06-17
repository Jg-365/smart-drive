import type { StyleSpecification } from 'maplibre-gl'

export type MapTheme = 'dark' | 'light'

// Variantes raster self-contained do CARTO (não dependem de vector tile server).
const TILES: Record<MapTheme, string> = {
  dark: 'dark_all',
  light: 'light_all',
}

/** Estilo raster do basemap para o tema dado (escuro por padrão). */
export function rasterStyleForTheme(theme: MapTheme): StyleSpecification {
  const variant = TILES[theme] ?? TILES.dark
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: [
          `https://a.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`,
          `https://b.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`,
          `https://c.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`,
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap © CARTO',
      },
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
  }
}

/** Lê o tema corrente do <html data-theme> (fallback dark) e devolve o estilo. */
export function currentBasemapStyle(): StyleSpecification {
  const applied =
    typeof document !== 'undefined' ? document.documentElement.dataset.theme : undefined
  return rasterStyleForTheme(applied === 'light' ? 'light' : 'dark')
}
