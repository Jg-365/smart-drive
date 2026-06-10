/**
 * Normaliza campos de texto livre (marca/modelo): remove espaços nas pontas,
 * colapsa espaços internos e descarta caracteres que não sejam letras, números,
 * espaço ou pontuação comum (-, ', ., parênteses) — sem rejeitar o valor.
 */
export function sanitizeText(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  return value
    .trim()
    .replace(/[^\p{L}\p{N}\s\-'.()]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
