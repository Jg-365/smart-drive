import { describe, expect, it } from 'vitest';
import { MAX_POLYLINE_POINTS, downsample, isValidCoord, toLngLat } from '../geo';

describe('isValidCoord', () => {
  it('aceita coordenada finita dentro dos ranges', () => {
    expect(isValidCoord(-23.5, -46.6)).toBe(true);
    expect(isValidCoord(0, 0)).toBe(true);
    expect(isValidCoord(90, 180)).toBe(true);
  });

  it('rejeita null/undefined, fora de range e não-finito', () => {
    expect(isValidCoord(null, null)).toBe(false);
    expect(isValidCoord(-23.5, null)).toBe(false);
    expect(isValidCoord(91, 0)).toBe(false);
    expect(isValidCoord(0, 181)).toBe(false);
    expect(isValidCoord(NaN, 0)).toBe(false);
    expect(isValidCoord(Infinity, 0)).toBe(false);
  });
});

describe('toLngLat', () => {
  it('converte ponto válido para [lng, lat]', () => {
    expect(toLngLat({ lat: -23.5, lng: -46.6 })).toEqual([-46.6, -23.5]);
  });
  it('retorna null para coordenada inválida', () => {
    expect(toLngLat({ lat: null, lng: null })).toBeNull();
    expect(toLngLat({ lat: 200, lng: 0 })).toBeNull();
  });
});

describe('downsample', () => {
  it('não altera quando <= max', () => {
    const pts = Array.from({ length: 10 }, (_, i) => i);
    expect(downsample(pts, 500)).toBe(pts);
  });

  it('reduz para max preservando primeiro e último (> 500 pontos)', () => {
    const pts = Array.from({ length: 2000 }, (_, i) => i);
    const out = downsample(pts);
    expect(out).toHaveLength(MAX_POLYLINE_POINTS);
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBe(1999);
  });
});
