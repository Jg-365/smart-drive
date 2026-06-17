// Utilitários de contraste WCAG 2.1 para auditar o design system (JOA-RF-06/07).
// As cores aqui espelham as CSS custom properties de app/globals.css (dark = :root,
// light = [data-theme="light"]). Mantê-las em sincronia se os tokens mudarem.

export type ThemeName = 'dark' | 'light'

export interface ThemeTokens {
  bg: string
  surface: string
  surface2: string
  text: string
  textDim: string
  textMute: string
  primary: string
  primaryDeep: string
  danger: string
  success: string
  warning: string
}

export const THEME_TOKENS: Record<ThemeName, ThemeTokens> = {
  dark: {
    bg: '#0A0A0F',
    surface: '#14141C',
    surface2: '#1C1C26',
    text: '#F2F2F6',
    textDim: '#8A8A99',
    textMute: '#5A5A6A',
    primary: '#00E5FF',
    primaryDeep: '#4D5BFF',
    danger: '#FF3344',
    success: '#2FE0A2',
    warning: '#FFB020',
  },
  light: {
    bg: '#F8F8FA',
    surface: '#EFEFF4',
    surface2: '#E6E6EE',
    text: '#0E0E16',
    textDim: '#5A5A70',
    textMute: '#9090A0',
    primary: '#0066CC',
    primaryDeep: '#3344CC',
    danger: '#CC1122',
    success: '#1AA06E',
    warning: '#B27400',
  },
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Luminância relativa (WCAG) de uma cor hex (0 = preto, 1 = branco). */
export function relativeLuminance(hex: string): number {
  const srgb = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

/** Razão de contraste WCAG entre duas cores hex (1..21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Limiares WCAG 2.1 AA. */
export const WCAG_AA_NORMAL = 4.5 // texto normal
export const WCAG_AA_LARGE = 3 // texto grande / componentes de UI
