import { sanitizeText } from './sanitize-text';

describe('sanitizeText', () => {
  it('mantém texto comum inalterado', () => {
    expect(sanitizeText('Toyota')).toBe('Toyota');
  });

  it('remove espaços nas pontas', () => {
    expect(sanitizeText('  Corolla  ')).toBe('Corolla');
  });

  it('trata string só com espaços como vazia', () => {
    expect(sanitizeText('   ')).toBe('');
  });

  it('colapsa espaços internos repetidos', () => {
    expect(sanitizeText('Corolla   Cross')).toBe('Corolla Cross');
  });

  it('mantém acentos, hífens, apóstrofos, pontos e parênteses', () => {
    expect(sanitizeText("Citroën C-HR (2.0) D'Ascanio")).toBe(
      "Citroën C-HR (2.0) D'Ascanio",
    );
  });

  it('remove caracteres especiais sem rejeitar o valor', () => {
    expect(sanitizeText('<script>Civic</script>')).toBe('scriptCivicscript');
  });

  it('ignora valores que não são string', () => {
    expect(sanitizeText(123)).toBe(123);
    expect(sanitizeText(undefined)).toBe(undefined);
  });
});
