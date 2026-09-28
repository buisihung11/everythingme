import type { DomainEvent } from '@studying/uber-clone/shared';
import {
  canApplyMatchedCallback,
  shouldCompensateAcceptOnMatchingFailure,
} from './ride-state.js';

export interface OfferRecord {
  id: string;
  rideId: string;
  driverId: string;
  status: string;
}

export interface RideRecord {
  id: string;
  status: string;
  driverId: string | null;
}

export interface MatchingRespondResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

export interface RideLifecycleDeps {
  findPendingOffer(
    rideId: string,
    driverId: string,
  ): Promise<OfferRecord | null>;
  claimOffer(
    offerId: string,
    status: 'ACCEPTED' | 'DECLINED',
  ): Promise<boolean>;
  revertAcceptedOfferToTimedOut(offerId: string): Promise<void>;
  findRide(rideId: string): Promise<RideRecord | null>;
  applyMatchedIfActive(rideId: string, driverId: string): Promise<boolean>;
  completeIfMatched(rideId: string): Promise<boolean>;
  applyNoDriversIfPreMatch(rideId: string): Promise<boolean>;
  releaseDriverLock(driverId: string, rideId: string): Promise<void>;
  extendDriverLock(
    driverId: string,
    rideId: string,
    ttlSeconds: number,
  ): Promise<void>;
  setDriverStatus(
    driverId: string,
    status: 'available' | 'busy',
  ): Promise<void>;
  matchingRespond(
    rideId: string,
    driverId: string,
    accept: boolean,
  ): Promise<MatchingRespondResult>;
  publish(event: DomainEvent): void;
}

export interface HttpResult {
  httpStatus: number;
  body: Record<string, unknown>;
}

async function compensateFailedAccept(
  deps: RideLifecycleDeps,
  offerId: string,
  rideId: string,
  driverId: string,
): Promise<void> {
  await deps.revertAcceptedOfferToTimedOut(offerId);
  await deps.releaseDriverLock(driverId, rideId);
  await deps.setDriverStatus(driverId, 'available');
  deps.publish({ type: 'offer.timeout', rideId, driverId });
  deps.publish({ type: 'lock.released', rideId, driverId });
}

/**
 * Driver accept/decline. Matching is the source of truth for the SFN token.
 * A failed accept must not leave the offer ACCEPTED and the driver busy.
 */
export async function respondToDriverOffer(
  deps: RideLifecycleDeps,
  rideId: string,
  driverId: string,
  accept: boolean,
): Promise<HttpResult> {
  const offer = await deps.findPendingOffer(rideId, driverId);
  if (!offer) {
    return { httpStatus: 404, body: { error: 'No pending offer found' } };
  }

  const claimed = await deps.claimOffer(
    offer.id,
    accept ? 'ACCEPTED' : 'DECLINED',
  );
  if (!claimed) {
    return { httpStatus: 404, body: { error: 'No pending offer found' } };
  }

  if (!accept) {
    await deps.releaseDriverLock(driverId, rideId);
    await deps.setDriverStatus(driverId, 'available');
    deps.publish({ type: 'offer.declined', rideId, driverId });
    deps.publish({ type: 'lock.released', rideId, driverId });
  }

  let matching: MatchingRespondResult;
  try {
    matching = await deps.matchingRespond(rideId, driverId, accept);
  } catch {
    if (shouldCompensateAcceptOnMatchingFailure(accept)) {
      await compensateFailedAccept(deps, offer.id, rideId, driverId);
    }
    return {
      httpStatus: 503,
      body: { error: 'matching service unavailable' },
    };
  }

  if (!matching.ok) {
    if (shouldCompensateAcceptOnMatchingFailure(accept)) {
      await compensateFailedAccept(deps, offer.id, rideId, driverId);
    }
    return { httpStatus: matching.status, body: matching.body };
  }

  if (accept) {
    deps.publish({ type: 'offer.accepted', rideId, driverId });
  }

  return { httpStatus: 200, body: matching.body };
}

/**
 * Notify-matched callback. Never resurrects COMPLETED / NO_DRIVERS / CANCELLED
 * rides, and never marks a driver busy unless the match write actually applied.
 */
export async function applyRideMatched(
  deps: RideLifecycleDeps,
  rideId: string,
  driverId: string,
  matchedLockTtl: number,
): Promise<{ applied: boolean }> {
  const ride = await deps.findRide(rideId);
  if (!ride || !canApplyMatchedCallback(ride.status)) {
    return { applied: false };
  }

  await deps.extendDriverLock(driverId, rideId, matchedLockTtl);
  const applied = await deps.applyMatchedIfActive(rideId, driverId);
  if (!applied) {
    return { applied: false };
  }

  await deps.setDriverStatus(driverId, 'busy');
  deps.publish({ type: 'ride.matched', rideId, driverId });
  return { applied: true };
}

/**
 * Complete a matched ride. Status is flipped first so a racing matched
 * callback cannot overwrite COMPLETED, then the lock is released.
 * Repeating complete is idempotent and still frees the driver.
 */
export async function completeRide(
  deps: RideLifecycleDeps,
  rideId: string,
): Promise<HttpResult> {
  const ride = await deps.findRide(rideId);
  if (!ride) {
    return { httpStatus: 404, body: { error: 'not found' } };
  }

  if (ride.status === 'COMPLETED') {
    if (ride.driverId) {
      await deps.releaseDriverLock(ride.driverId, rideId);
      await deps.setDriverStatus(ride.driverId, 'available');
    }
    return { httpStatus: 200, body: { ok: true } };
  }

  if (ride.status !== 'MATCHED' || !ride.driverId) {
    return { httpStatus: 409, body: { error: 'ride is not matched' } };
  }

  const driverId = ride.driverId;
  const completed = await deps.completeIfMatched(rideId);
  if (!completed) {
    const current = await deps.findRide(rideId);
    if (current?.status !== 'COMPLETED') {
      return { httpStatus: 409, body: { error: 'ride is not matched' } };
    }
  }

  await deps.releaseDriverLock(driverId, rideId);
  await deps.setDriverStatus(driverId, 'available');
  if (completed) {
    deps.publish({ type: 'lock.released', rideId, driverId });
    deps.publish({ type: 'ride.completed', rideId, driverId });
  }
  return { httpStatus: 200, body: { ok: true } };
}

export async function applyNoDrivers(
  deps: RideLifecycleDeps,
  rideId: string,
): Promise<{ applied: boolean }> {
  const applied = await deps.applyNoDriversIfPreMatch(rideId);
  if (applied) {
    deps.publish({ type: 'ride.no_drivers', rideId });
  }
  return { applied };
}
