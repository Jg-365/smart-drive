import { afterEach, describe, expect, it } from 'vitest'
import { rasterStyleForTheme, currentBasemapStyle } from '../basemap'

function tilesOf(style: ReturnType<typeof rasterStyleForTheme>): string {
  const src = style.sources.basemap as { tiles?: string[] }
  return (src.tiles ?? []).join(' ')
}

afterEach(() => {
  delete document.documentElement.dataset.theme
})

describe('rasterStyleForTheme (JOA-RF-06 edge: MapLibre segue o tema)', () => {
  it('dark usa tiles dark_all', () => {
    expect(tilesOf(rasterStyleForTheme('dark'))).toContain('dark_all')
  })
  it('light usa tiles light_all', () => {
    expect(tilesOf(rasterStyleForTheme('light'))).toContain('light_all')
  })
  it('estilo é um StyleSpecification raster válido', () => {
    const s = rasterStyleForTheme('dark')
    expect(s.version).toBe(8)
    expect(s.layers[0]).toMatchObject({ id: 'basemap', type: 'raster' })
  })
})

describe('currentBasemapStyle (lê <html data-theme>)', () => {
  it('sem data-theme → dark por padrão', () => {
    expect(tilesOf(currentBasemapStyle())).toContain('dark_all')
  })
  it('data-theme=light → tiles claros', () => {
    document.documentElement.dataset.theme = 'light'
    expect(tilesOf(currentBasemapStyle())).toContain('light_all')
  })
})
