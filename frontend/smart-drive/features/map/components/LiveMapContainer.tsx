'use client';

import { toLngLat } from '@/features/shared/geo';
import { useDrivingEvents, useRoute } from '@/features/shared/realtime';
import { EventSeverity } from '@/features/shared/types';
import { LiveMap, type LiveMapEvent, type LiveMapProps } from './LiveMap';

/**
 * Liga o store ao LiveMap: a rota acumulada, o marcador do veículo (último ponto
 * válido — congela se o GPS some) e os marcadores de evento com coordenada.
 */
export function LiveMapContainer(props: Pick<LiveMapProps, 'className' | 'style' | 'styleUrl'>) {
  const route = useRoute();
  const events = useDrivingEvents();

  const vehicle = route.length ? route[route.length - 1] : null;

  const eventMarkers: LiveMapEvent[] = events.flatMap((e) => {
    const lngLat = toLngLat(e);
    if (!lngLat) return [];
    const high = e.severity === EventSeverity.HIGH || e.severity === EventSeverity.CRITICAL;
    return [{ lngLat, high }];
  });

  return <LiveMap route={route} vehicle={vehicle} events={eventMarkers} {...props} />;
}

export default LiveMapContainer;
