/**
 * offer-driver.worker.ts
 * The key worker: notifies Ride Service of the new offer first, then stores
 * the task token in Redis and exits WITHOUT sending SendTaskSuccess.
 *
 * The token is held until:
 *   - Driver accepts  → SendTaskSuccess via /matches/:rideId/offers/:driverId/respond
 *   - Driver declines → SendTaskFailure(DriverDeclined) via respond endpoint
 *   - 60s timeout    → SFN Local fires States.Timeout, caught by AdvanceCursor
 *
 * Lock-deny path (new):
 *   - Ride Service returns 409 because another ride holds the driver lock.
 *   - We call SendTaskFailure({ error: 'DriverLocked' }) immediately and return
 *     WITHOUT saving the token (no point holding it).
 *   - ASL catches DriverLocked in OfferToDriver → AdvanceCursor, same as
 *     States.Timeout and DriverDeclined.
 */

import { SendTaskFailureCommand } from '@aws-sdk/client-sfn';
import { sfn, sfnConfig } from '../sfn-client.js';
import { saveToken } from '../token-store.js';
import { startWorkerLoop } from './worker-loop.js';

const RIDE_URL = process.env.RIDE_URL ?? 'http://localhost:4401';

interface Input {
  rideId: string;
  currentDriverId: string;
  cursor: { index: number };
  candidates: { driverIds: string[]; count: number };
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
}

async function handler(input: Input, taskToken: string): Promise<undefined> {
  const { rideId, currentDriverId, cursor } = input;

  console.log(
    `[offer-driver] ride=${rideId} offering to driver=${currentDriverId} (index=${cursor.index})`,
  );

  // ── 1. Call Ride Service BEFORE saving the token ──────────────────────────
  // If the driver is already locked by another ride, the endpoint returns 409.
  // In that case we fail the SFN task immediately so the state machine can
  // advance the cursor and try the next driver, without ever saving the token.
  try {
    const res = await fetch(`${RIDE_URL}/internal/rides/${rideId}/offers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        rideId,
        driverId: currentDriverId,
        offerIndex: cursor.index,
      }),
    });

    if (res.status === 409) {
      console.log(
        `[offer-driver] driver=${currentDriverId} is locked by another ride — failing task`,
      );
      await sfn.send(
        new SendTaskFailureCommand({
          taskToken,
          error: 'DriverLocked',
          cause: `Driver ${currentDriverId} is exclusively locked by another ride`,
        }),
      );
      // Return without saving token — worker-loop sees undefined + keepToken flag,
      // so it will not attempt a second SendTaskSuccess/Failure.
      return undefined;
    }

    if (!res.ok) {
      console.error(
        `[offer-driver] ride service returned ${res.status} for ride=${rideId} driver=${currentDriverId}`,
      );
      // Non-409 failure: fall through to save token; the 65s SFN timeout will
      // still advance the cursor if the driver never responds.
    }
  } catch (err) {
    console.error('[offer-driver] failed to notify ride service:', err);
    // Network error: fall through to save token; SFN timeout will advance.
  }

  // ── 2. Store token — driver was offered successfully ─────────────────────
  // The respond endpoint (accept/decline) will resolve this task via the token.
  await saveToken(rideId, currentDriverId, taskToken);

  // Return undefined to signal the loop that we are NOT calling SendTaskSuccess.
  return undefined;
}

export function startOfferDriverWorker(): void {
  startWorkerLoop(
    sfnConfig.activities['offer-driver'],
    'offer-driver',
    handler,
    { keepTokenForManualCompletion: true },
  );
}
