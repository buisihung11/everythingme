/**
 * fetch-candidates.worker.ts
 * Calls Location Service to get nearby available drivers.
 * Returns { driverIds: string[], count: number, rideId, pickup, dropoff }
 */

import { sfnConfig } from '../sfn-client.js';
import { startWorkerLoop } from './worker-loop.js';

const LOCATION_URL = process.env.LOCATION_URL ?? 'http://localhost:4403';

interface Input {
  rideId: string;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  radiusKm?: number;
}

interface Output {
  driverIds: string[];
  count: number;
  rideId: string;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
}

async function handler(input: Input): Promise<Output> {
  const { rideId, pickup, dropoff, radiusKm = 5 } = input;
  const params = new URLSearchParams({
    lat: pickup.lat.toString(),
    lng: pickup.lng.toString(),
    radiusKm: radiusKm.toString(),
    limit: '10',
  });

  const res = await fetch(`${LOCATION_URL}/drivers/nearby?${params}`);
  if (!res.ok) {
    throw new Error(`Location service error: ${res.status}`);
  }

  const data = (await res.json()) as { drivers: Array<{ id: string }> };
  const driverIds = data.drivers.map((d) => d.id);

  console.log(
    `[fetch-candidates] ride=${rideId} found ${driverIds.length} drivers`,
  );

  return {
    driverIds,
    count: driverIds.length,
    rideId,
    pickup,
    dropoff,
  };
}

export function startFetchCandidatesWorker(): void {
  startWorkerLoop(
    sfnConfig.activities['fetch-candidates'],
    'fetch-candidates',
    handler,
  );
}
