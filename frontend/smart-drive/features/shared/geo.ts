// Utilitários geográficos puros (testáveis sem MapLibre/DOM) — JOA-RF-04.

/** Coordenada no formato do MapLibre/GeoJSON: [lng, lat]. */
export type LngLat = [number, number];

/** Acima disto a polyline é downsampled para renderizar (JOA-RF-04). */
export const MAX_POLYLINE_POINTS = 500;

export function isValidCoord(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** [lng, lat] de um ponto com coordenada válida, senão null (ignora null/fora de range). */
export function toLngLat(p: {
  lat?: number | null;
  lng?: number | null;
}): LngLat | null {
  return isValidCoord(p.lat, p.lng) ? [p.lng as number, p.lat as number] : null;
}

/**
 * Downsampling uniforme preservando o primeiro e o último ponto. Aplica-se só
 * quando o total passa de `max` (JOA-RF-04: > 500 pontos).
 */
export function downsample<T>(points: T[], max = MAX_POLYLINE_POINTS): T[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}
