/**
 * Fetches a driving polyline from the public OSRM demo.
 * Leaflet only draws points; OSRM supplies the road-following coordinates.
 */

import type { LatLng } from './booking-map-state';

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

const cache = new Map<string, LatLng[]>();
const inflight = new Map<string, Promise<LatLng[] | null>>();

function routeKey(from: LatLng, to: LatLng): string {
  return `${from.lng.toFixed(5)},${from.lat.toFixed(5)};${to.lng.toFixed(5)},${to.lat.toFixed(5)}`;
}

async function requestRoadRoute(from: LatLng, to: LatLng): Promise<LatLng[] | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_URL}/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    code?: string;
    routes?: Array<{ geometry?: { coordinates?: Array<[number, number]> } }>;
  };
  const line = data.routes?.[0]?.geometry?.coordinates;
  if (data.code !== 'Ok' || !line?.length) return null;

  return line.map(([lng, lat]) => ({ lat, lng }));
}

/** Returns a road polyline, or null if OSRM is unavailable. */
export function fetchRoadRoute(from: LatLng, to: LatLng): Promise<LatLng[] | null> {
  const key = routeKey(from, to);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = requestRoadRoute(from, to)
    .then((points) => {
      if (points) cache.set(key, points);
      return points;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}
