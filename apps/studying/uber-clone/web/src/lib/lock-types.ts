/**
 * lock-types.ts
 * Local type definitions for distributed-lock domain events and lock data.
 * These mirror the shapes the backend publishes until the shared package
 * exports them; prefer importing from shared once that PR lands.
 */

import type { DomainEvent } from '@studying/uber-clone/shared';

// ── Lock data returned by GET /locks ────────────────────────────────────────

export interface LockInfo {
  driverId: string;
  rideId: string;
  ttlSeconds: number | null;
}

// ── Lock SSE events ──────────────────────────────────────────────────────────

export interface LockAcquiredEvent {
  type: 'lock.acquired';
  rideId: string;
  driverId: string;
}

export interface LockDeniedEvent {
  type: 'lock.denied';
  rideId: string;
  driverId: string;
  /** The ride ID that currently holds the lock. */
  heldBy: string;
}

export interface LockReleasedEvent {
  type: 'lock.released';
  rideId: string;
  driverId: string;
}

export type LockEvent = LockAcquiredEvent | LockDeniedEvent | LockReleasedEvent;

/** Every event type the SSE stream may carry (shared domain events + lock events). */
export type AnyEvent = DomainEvent | LockEvent;

// ── Type guards ──────────────────────────────────────────────────────────────

export function isLockEvent(e: AnyEvent): e is LockEvent {
  return (
    e.type === 'lock.acquired' ||
    e.type === 'lock.denied' ||
    e.type === 'lock.released'
  );
}

/** Latest lock holder per driver, merged from poll + driver hashes + SSE. */
export function resolveDriverLocks(
  locks: LockInfo[] | undefined,
  drivers: Array<{ id: string; lockRideId?: string }>,
  sseEvents: AnyEvent[],
): Record<string, LockInfo> {
  const byDriver: Record<string, LockInfo> = {};

  for (const lock of locks ?? []) {
    byDriver[lock.driverId] = lock;
  }

  for (const driver of drivers) {
    if (driver.lockRideId && !byDriver[driver.id]) {
      byDriver[driver.id] = {
        driverId: driver.id,
        rideId: driver.lockRideId,
        ttlSeconds: null,
      };
    }
  }

  for (const event of sseEvents) {
    if (event.type === 'lock.acquired') {
      byDriver[event.driverId] = {
        driverId: event.driverId,
        rideId: event.rideId,
        ttlSeconds: byDriver[event.driverId]?.ttlSeconds ?? null,
      };
    } else if (event.type === 'lock.released') {
      delete byDriver[event.driverId];
    }
  }

  return byDriver;
}
