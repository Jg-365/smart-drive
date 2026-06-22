'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { sdVars as SD } from '@/lib/sd-vars';
import { type LngLat, MAX_POLYLINE_POINTS, downsample } from '@/features/shared/geo';
import { currentBasemapStyle, rasterStyleForTheme } from '../basemap';
import { useTheme } from '@/features/shared/theme/useTheme';

export interface LiveMapEvent {
  lngLat: LngLat;
  high: boolean;
}

export interface LiveMapProps {
  route: LngLat[];
  vehicle: LngLat | null;
  events?: LiveMapEvent[];
  /** Override do estilo (URL de style JSON). Default: raster escuro CARTO. */
  styleUrl?: string;
  /** Se true, recentraliza no veículo a cada novo ponto (modo "seguir"). */
  follow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_CENTER: LngLat = [-38.52674, -3.73192]; // Fortaleza/CE
const lineGeoJSON = (coords: LngLat[]) => ({
  type: 'Feature' as const,
  geometry: { type: 'LineString' as const, coordinates: coords },
  properties: {},
});
const eventsGeoJSON = (events: LiveMapEvent[]) => ({
  type: 'FeatureCollection' as const,
  features: events.map((e) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: e.lngLat },
    properties: { high: e.high },
  })),
});

/**
 * Instala as camadas de dados (rota + eventos) sobre o basemap atual. É chamada
 * no load inicial e após cada setStyle (troca de tema), pois trocar o estilo do
 * MapLibre remove sources/layers customizados (o marcador do veículo é um
 * elemento DOM e sobrevive). Só é invocada quando as sources estão ausentes
 * (load e logo após o style novo carregar), então não há adição duplicada.
 */
function installDataLayers(map: maplibregl.Map, route: LngLat[], events: LiveMapEvent[]) {
  map.addSource('route', { type: 'geojson', data: lineGeoJSON(downsample(route, MAX_POLYLINE_POINTS)) });
  map.addLayer({
    id: 'route', type: 'line', source: 'route',
    paint: { 'line-color': SD.primary, 'line-width': 4 },
  });
  map.addSource('events', { type: 'geojson', data: eventsGeoJSON(events) });
  map.addLayer({
    id: 'events', type: 'circle', source: 'events',
    paint: {
      'circle-radius': 6,
      'circle-color': ['case', ['get', 'high'], SD.danger, SD.warning],
      'circle-stroke-width': 2,
      'circle-stroke-color': SD.bg,
    },
  });
}

export function LiveMap({ route, vehicle, events = [], styleUrl, follow = false, className, style }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const loadedRef = useRef(false);
  const centeredRef = useRef(false);
  const sawTileRef = useRef(false);
  const [tileError, setTileError] = useState(false);
  const { theme } = useTheme();

  // Dados mais recentes p/ re-instalar as camadas após um setStyle (troca de tema),
  // sem depender de closures antigas. Sincronizados num effect (não no render).
  const routeRef = useRef(route);
  const eventsRef = useRef(events);
  useEffect(() => {
    routeRef.current = route;
    eventsRef.current = events;
  });

  // init (uma vez)
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl ?? currentBasemapStyle(),
      center: vehicle ?? route[0] ?? DEFAULT_CENTER,
      zoom: 14,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    // Marca sucesso assim que QUALQUER tile do basemap carrega — e limpa o aviso.
    map.on('data', (e: maplibregl.MapSourceDataEvent) => {
      if (e.sourceId === 'basemap' && e.dataType === 'source' && e.tile) {
        sawTileRef.current = true;
        setTileError(false);
      }
    });
    // Só mostra o fallback se NENHUM tile carregou (servidor inalcançável) — ignora
    // erros transitórios (abort de tile em pan/zoom) depois que o mapa já renderizou.
    map.on('error', () => {
      if (!sawTileRef.current) setTileError(true);
    });

    map.on('load', () => {
      loadedRef.current = true;
      installDataLayers(map, routeRef.current, eventsRef.current);

      const el = document.createElement('div');
      el.setAttribute('data-testid', 'vehicle-marker');
      el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${SD.primary};box-shadow:0 0 0 4px ${SD.primary}33;border:2px solid ${SD.bg}`;
      markerRef.current = new maplibregl.Marker({ element: el });
      if (vehicle) markerRef.current.setLngLat(vehicle).addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      loadedRef.current = false;
      centeredRef.current = false;
      sawTileRef.current = false;
    };
    // init só na montagem; updates abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl]);

  // Troca o basemap ao alternar o tema da interface (claro/escuro) sem recriar o
  // mapa: setStyle + re-instala as camadas de dados (que o setStyle remove). O
  // marcador do veículo é DOM e sobrevive. Ignora quando há styleUrl (override).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current || styleUrl) return;
    sawTileRef.current = false;
    map.setStyle(rasterStyleForTheme(theme));
    const onStyle = () => installDataLayers(map, routeRef.current, eventsRef.current);
    map.once('styledata', onStyle);
    return () => {
      map.off('styledata', onStyle);
    };
  }, [theme, styleUrl]);

  // updates de rota / veículo / eventos
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const routeSrc = map.getSource('route') as maplibregl.GeoJSONSource | undefined;
    routeSrc?.setData(lineGeoJSON(downsample(route, MAX_POLYLINE_POINTS)));

    const eventsSrc = map.getSource('events') as maplibregl.GeoJSONSource | undefined;
    eventsSrc?.setData(eventsGeoJSON(events));

    if (vehicle && markerRef.current) {
      markerRef.current.setLngLat(vehicle).addTo(map);
      // centraliza no primeiro ponto válido; em modo "seguir", recentra sempre.
      if (follow || !centeredRef.current) {
        map.setCenter(vehicle);
        centeredRef.current = true;
      }
    }
  }, [route, vehicle, events, follow]);

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {tileError && (
        <div style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          background: SD.bg, color: SD.textDim, fontFamily: SD.fontMono, fontSize: 12,
          textAlign: 'center', padding: 24,
        }}>
          ⚠ Mapa indisponível (sem conexão com o servidor de tiles).
          <br />A telemetria continua funcionando.
        </div>
      )}
    </div>
  );
}

export default LiveMap;
