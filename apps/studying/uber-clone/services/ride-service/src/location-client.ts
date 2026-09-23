/**
 * location-client.ts
 * Thin helpers for Ride Service → Location Service driver status + lock operations.
 */

const LOCATION_URL = process.env.LOCATION_URL ?? 'http://localhost:4403';

export type DriverAvailability = 'available' | 'busy' | 'offline';

export type LockAcquireResult =
  | { acquired: true }
  | { acquired: false; heldBy: string };

// ── Driver status ─────────────────────────────────────────────────────────────

export async function setDriverStatus(
  driverId: string,
  status: DriverAvailability,
): Promise<void> {
  try {
    const res = await fetch(`${LOCATION_URL}/drivers/${driverId}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      console.error(
        `[ride] failed to set driver ${driverId} → ${status}: ${res.status}`,
      );
    }
  } catch (err) {
    console.error(`[ride] location service unreachable for ${driverId}:`, err);
  }
}

// ── Distributed driver lock ───────────────────────────────────────────────────

/**
 * Try to acquire an exclusive lock for the given driver.
 * Returns { acquired: true } on 201, { acquired: false, heldBy } on 409.
 * Throws on any other non-200 status.
 *
 * TTL defaults: pass 30 for the offer-window, 3600 for post-match.
 */
export async function acquireDriverLock(
  driverId: string,
  rideId: string,
  ttlSeconds?: number,
): Promise<LockAcquireResult> {
  const body: Record<string, unknown> = { rideId };
  if (ttlSeconds !== undefined) body.ttlSeconds = ttlSeconds;

  const res = await fetch(`${LOCATION_URL}/drivers/${driverId}/lock`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.status === 201) return { acquired: true };

  if (res.status === 409) {
    const data = (await res.json()) as { heldBy: string };
    return { acquired: false, heldBy: data.heldBy };
  }

  throw new Error(
    `[ride] unexpected status ${res.status} acquiring lock for driver ${driverId}`,
  );
}

/**
 * Compare-and-delete: only deletes the lock if it is still owned by rideId.
 * 200 means released (or already gone); 409 means held by a different ride.
 * Errors are logged and swallowed so a failed release never blocks the caller.
 */
export async function releaseDriverLock(
  driverId: string,
  rideId: string,
): Promise<void> {
  try {
    const res = await fetch(`${LOCATION_URL}/drivers/${driverId}/lock`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rideId }),
    });
    if (res.status === 409) {
      console.warn(
        `[ride] lock release for driver ${driverId} denied (held by different ride)`,
      );
    } else if (!res.ok) {
      console.error(
        `[ride] unexpected status ${res.status} releasing lock for driver ${driverId}`,
      );
    }
  } catch (err) {
    console.error(`[ride] failed to release lock for driver ${driverId}:`, err);
  }
}

/**
 * Extend an existing lock TTL (e.g. on match → bump to 1 h).
 * 409 means we no longer own the lock; this is logged but not thrown.
 */
export async function extendDriverLock(
  driverId: string,
  rideId: string,
  ttlSeconds: number,
): Promise<void> {
  try {
    const res = await fetch(`${LOCATION_URL}/drivers/${driverId}/lock/extend`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rideId, ttlSeconds }),
    });
    if (res.status === 409) {
      console.warn(
        `[ride] lock extend for driver ${driverId} denied (not owner)`,
      );
    } else if (!res.ok) {
      console.error(
        `[ride] unexpected status ${res.status} extending lock for driver ${driverId}`,
      );
    }
  } catch (err) {
    console.error(`[ride] failed to extend lock for driver ${driverId}:`, err);
  }
}
