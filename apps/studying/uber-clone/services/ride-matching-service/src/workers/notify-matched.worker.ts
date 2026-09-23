/**
 * notify-matched.worker.ts
 * Calls Ride Service to mark the ride as MATCHED with the accepting driver.
 */

import { sfnConfig } from '../sfn-client.js';
import { startWorkerLoop } from './worker-loop.js';

const RIDE_URL = process.env.RIDE_URL ?? 'http://localhost:4401';

interface Input {
  rideId: string;
  driverId: string;
}

async function handler(input: Input): Promise<{ ok: boolean }> {
  const { rideId, driverId } = input;
  console.log(`[notify-matched] ride=${rideId} driver=${driverId}`);

  const res = await fetch(
    `${RIDE_URL}/internal/rides/${rideId}/matched`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rideId, driverId }),
    },
  );
  if (!res.ok) {
    throw new Error(`Ride service error: ${res.status}`);
  }
  return { ok: true };
}

export function startNotifyMatchedWorker(): void {
  startWorkerLoop(
    sfnConfig.activities['notify-matched'],
    'notify-matched',
    handler,
  );
}
