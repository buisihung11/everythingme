/**
 * Replaces straight map segments with OSRM road geometries when available.
 */

import { useEffect, useMemo, useState } from 'react';
import type { LatLng, MapLine } from '../lib/booking-map-state';
import { fetchRoadRoute } from '../lib/osrm';

function endpoints(line: MapLine): { from: LatLng; to: LatLng } | null {
  const from = line.points[0];
  const to = line.points[line.points.length - 1];
  if (!from || !to) return null;
  return { from, to };
}

function lineSignature(lines: MapLine[]): string {
  return lines
    .map((line) => {
      const ends = endpoints(line);
      if (!ends) return line.id;
      return `${line.id}:${ends.from.lat.toFixed(5)},${ends.from.lng.toFixed(5)}>${ends.to.lat.toFixed(5)},${ends.to.lng.toFixed(5)}`;
    })
    .join('|');
}

export function useRoadRoutes(lines: MapLine[]): MapLine[] {
  const signature = lineSignature(lines);
  const [roads, setRoads] = useState<Record<string, LatLng[]>>({});

  useEffect(() => {
    if (lines.length === 0) return;

    let cancelled = false;
    const snapshot = lines;

    void (async () => {
      const next: Record<string, LatLng[]> = {};
      await Promise.all(
        snapshot.map(async (line) => {
          const ends = endpoints(line);
          if (!ends) return;
          const points = await fetchRoadRoute(ends.from, ends.to);
          if (points) next[line.id] = points;
        }),
      );
      if (!cancelled) setRoads(next);
    })();

    return () => {
      cancelled = true;
    };
    // `signature` is a stable digest of `lines` endpoints.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return useMemo(
    () =>
      lines.map((line) =>
        roads[line.id] && roads[line.id].length > 2
          ? { ...line, points: roads[line.id] }
          : line,
      ),
    [lines, roads],
  );
}
