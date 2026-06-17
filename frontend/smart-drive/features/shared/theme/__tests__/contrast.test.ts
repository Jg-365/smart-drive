import { describe, expect, it } from 'vitest'
import {
  THEME_TOKENS, contrastRatio, relativeLuminance,
  WCAG_AA_NORMAL, WCAG_AA_LARGE, type ThemeName,
} from '../contrast'

const THEMES: ThemeName[] = ['dark', 'light']

describe('contrastRatio (util)', () => {
  it('preto x branco ≈ 21:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
  })
  it('mesma cor = 1:1', () => {
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5)
  })
})

describe('Auditoria WCAG AA do design system (JOA-RF-06/07)', () => {
  for (const theme of THEMES) {
    const t = THEME_TOKENS[theme]

    it(`[${theme}] texto principal sobre bg e surface ≥ ${WCAG_AA_NORMAL}:1`, () => {
      expect(contrastRatio(t.text, t.bg)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL)
      expect(contrastRatio(t.text, t.surface)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL)
      expect(contrastRatio(t.text, t.surface2)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL)
    })

    it(`[${theme}] texto secundário (dim) sobre bg ≥ ${WCAG_AA_NORMAL}:1`, () => {
      expect(contrastRatio(t.textDim, t.bg)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL)
    })

    it(`[${theme}] cores de ação/estado sobre bg ≥ ${WCAG_AA_LARGE}:1 (UI/large)`, () => {
      expect(contrastRatio(t.primary, t.bg)).toBeGreaterThanOrEqual(WCAG_AA_LARGE)
      expect(contrastRatio(t.danger, t.bg)).toBeGreaterThanOrEqual(WCAG_AA_LARGE)
      expect(contrastRatio(t.success, t.bg)).toBeGreaterThanOrEqual(WCAG_AA_LARGE)
      expect(contrastRatio(t.warning, t.bg)).toBeGreaterThanOrEqual(WCAG_AA_LARGE)
    })
  }
})

describe('Identidade visual HQ dark (JOA-RF-07)', () => {
  it('SPEC: tema dark não tem fundo branco (bg muito escuro)', () => {
    expect(relativeLuminance(THEME_TOKENS.dark.bg)).toBeLessThan(0.05)
    expect(relativeLuminance(THEME_TOKENS.dark.surface)).toBeLessThan(0.05)
  })

  it('SPEC: tema light não usa fundo escuro (bg claro)', () => {
    expect(relativeLuminance(THEME_TOKENS.light.bg)).toBeGreaterThan(0.7)
  })

  it('SPEC: cor primária é ciano/azul elétrico no dark', () => {
    // ciano: componente azul (B) e verde (G) altos, vermelho (R) baixo
    expect(THEME_TOKENS.dark.primary.toUpperCase()).toBe('#00E5FF')
  })

  it('SPEC: alerta crítico é vermelho com destaque em ambos os temas', () => {
    for (const theme of THEMES) {
      const [r, g, b] = hexChannels(THEME_TOKENS[theme].danger)
      expect(r).toBeGreaterThan(g)
      expect(r).toBeGreaterThan(b)
    }
  })
})

function hexChannels(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
