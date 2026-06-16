import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LngLat } from '@/features/shared/geo';

const h = vi.hoisted(() => {
  const sources: Record<string, { setData: ReturnType<typeof vi.fn> }> = {
    route: { setData: vi.fn() },
    events: { setData: vi.fn() },
  };
  const map = {
    handlers: {} as Record<string, ((...a: unknown[]) => void)[]>,
    addControl: vi.fn(),
    on: vi.fn(function (this: typeof map, ev: string, cb: (...a: unknown[]) => void) {
      (this.handlers[ev] ??= []).push(cb);
    }),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getSource: vi.fn((id: string) => sources[id]),
    setCenter: vi.fn(),
    remove: vi.fn(),
    fire(ev: string, ...args: unknown[]) {
      (map.handlers[ev] ?? []).forEach((cb) => cb(...args));
    },
  };
  const marker = {
    setLngLat: vi.fn(function (this: unknown) { return this; }),
    addTo: vi.fn(function (this: unknown) { return this; }),
  };
  const Map = vi.fn(function (_opts?: { center?: unknown; zoom?: number }) { return map; });
  const Marker = vi.fn(function () { return marker; });
  const NavigationControl = vi.fn(function () { return {}; });
  return { sources, map, marker, Map, Marker, NavigationControl };
});

vi.mock('maplibre-gl', () => ({
  default: { Map: h.Map, Marker: h.Marker, NavigationControl: h.NavigationControl },
}));

import { LiveMap } from '../LiveMap';

const A: LngLat = [-38.52674, -3.73192];
const B: LngLat = [-38.5, -3.7];

beforeEach(() => {
  h.map.handlers = {};
  vi.clearAllMocks();
});
afterEach(() => vi.clearAllMocks());

describe('LiveMap', () => {
  it('constrói o mapa centralizado no primeiro ponto e adiciona controle de zoom', () => {
    render(<LiveMap route={[A]} vehicle={null} />);
    expect(h.Map).toHaveBeenCalledTimes(1);
    expect(h.Map.mock.calls[0][0]).toMatchObject({ center: A, zoom: 14 });
    // NavigationControl = zoom in/out
    expect(h.NavigationControl).toHaveBeenCalled();
    expect(h.map.addControl).toHaveBeenCalled();
  });

  it('no load adiciona as sources de rota e eventos e o marcador do veículo', () => {
    render(<LiveMap route={[A]} vehicle={A} />);
    act(() => h.map.fire('load'));
    const sourceIds = h.map.addSource.mock.calls.map((c) => c[0]);
    expect(sourceIds).toContain('route');
    expect(sourceIds).toContain('events');
    expect(h.marker.addTo).toHaveBeenCalled();
  });

  it('atualiza a polyline e move/centra o marcador a cada novo ponto', () => {
    const { rerender } = render(<LiveMap route={[A]} vehicle={A} />);
    act(() => h.map.fire('load'));
    h.marker.setLngLat.mockClear();

    rerender(<LiveMap route={[A, B]} vehicle={B} />);
    expect(h.sources.route.setData).toHaveBeenCalled();
    expect(h.marker.setLngLat).toHaveBeenCalledWith(B);
    expect(h.map.setCenter).toHaveBeenCalledWith(B);
  });

  it('exibe fallback quando o tile server falha', () => {
    render(<LiveMap route={[A]} vehicle={A} />);
    act(() => h.map.fire('error'));
    expect(screen.getByText(/Mapa indisponível/)).toBeInTheDocument();
  });
});
