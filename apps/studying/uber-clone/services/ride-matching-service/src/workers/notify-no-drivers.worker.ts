/**
 * notify-no-drivers.worker.ts
 * Calls Ride Service to mark the ride as NO_DRIVERS.
 */

import { sfnConfig } from '../sfn-client.js';
import { startWorkerLoop } from './worker-loop.js';

const RIDE_URL = process.env.RIDE_URL ?? 'http://localhost:4401';

interface Input {
  rideId: string;
}

async function handler(input: Input): Promise<{ ok: boolean }> {
  const { rideId } = input;
  console.log(`[notify-no-drivers] ride=${rideId}`);

  const res = await fetch(
    `${RIDE_URL}/internal/rides/${rideId}/no-drivers`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rideId }),
    },
  );
  if (!res.ok) {
    throw new Error(`Ride service error: ${res.status}`);
  }
  return { ok: true };
}

export function startNotifyNoDriversWorker(): void {
  startWorkerLoop(
    sfnConfig.activities['notify-no-drivers'],
    'notify-no-drivers',
    handler,
  );
}
