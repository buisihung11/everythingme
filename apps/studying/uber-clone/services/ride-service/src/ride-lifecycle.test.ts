import { describe, expect, it } from 'vitest';
import type { DomainEvent } from '@studying/uber-clone/shared';
import {
  applyNoDrivers,
  applyRideMatched,
  completeRide,
  respondToDriverOffer,
  type MatchingRespondResult,
  type OfferRecord,
  type RideLifecycleDeps,
  type RideRecord,
} from './ride-lifecycle.js';
import {
  canApplyMatchedCallback,
  canApplyNoDriversCallback,
  shouldCompensateAcceptOnMatchingFailure,
} from './ride-state.js';

interface FakeWorld {
  rides: Map<string, RideRecord>;
  offers: Map<string, OfferRecord>;
  locks: Map<string, string>;
  driverStatus: Map<string, 'available' | 'busy'>;
  events: DomainEvent[];
  matching: MatchingRespondResult | Error;
}

function createFake(world: FakeWorld): RideLifecycleDeps {
  return {
    async findPendingOffer(rideId, driverId) {
      return (
        [...world.offers.values()].find(
          (offer) =>
            offer.rideId === rideId &&
            offer.driverId === driverId &&
            offer.status === 'PENDING',
        ) ?? null
      );
    },
    async claimOffer(offerId, status) {
      const offer = world.offers.get(offerId);
      if (!offer || offer.status !== 'PENDING') return false;
      world.offers.set(offerId, { ...offer, status });
      return true;
    },
    async revertAcceptedOfferToTimedOut(offerId) {
      const offer = world.offers.get(offerId);
      if (offer?.status === 'ACCEPTED') {
        world.offers.set(offerId, { ...offer, status: 'TIMED_OUT' });
      }
    },
    async findRide(rideId) {
      return world.rides.get(rideId) ?? null;
    },
    async applyMatchedIfActive(rideId, driverId) {
      const ride = world.rides.get(rideId);
      if (!ride || !canApplyMatchedCallback(ride.status)) return false;
      world.rides.set(rideId, { ...ride, status: 'MATCHED', driverId });
      return true;
    },
    async completeIfMatched(rideId) {
      const ride = world.rides.get(rideId);
      if (!ride || ride.status !== 'MATCHED') return false;
      world.rides.set(rideId, { ...ride, status: 'COMPLETED' });
      return true;
    },
    async applyNoDriversIfPreMatch(rideId) {
      const ride = world.rides.get(rideId);
      if (!ride || !canApplyNoDriversCallback(ride.status)) return false;
      world.rides.set(rideId, { ...ride, status: 'NO_DRIVERS' });
      return true;
    },
    async releaseDriverLock(driverId, rideId) {
      if (world.locks.get(driverId) === rideId) {
        world.locks.delete(driverId);
      }
    },
    async extendDriverLock(driverId, rideId) {
      if (world.locks.get(driverId) === rideId) {
        world.locks.set(driverId, rideId);
      }
    },
    async setDriverStatus(driverId, status) {
      world.driverStatus.set(driverId, status);
    },
    async matchingRespond() {
      if (world.matching instanceof Error) throw world.matching;
      return world.matching;
    },
    publish(event) {
      world.events.push(event);
    },
  };
}

function seededOfferWorld(
  matching: MatchingRespondResult | Error,
): FakeWorld {
  return {
    rides: new Map([
      ['ride-1', { id: 'ride-1', status: 'MATCHING', driverId: null }],
    ]),
    offers: new Map([
      [
        'offer-1',
        {
          id: 'offer-1',
          rideId: 'ride-1',
          driverId: 'driver-1',
          status: 'PENDING',
        },
      ],
    ]),
    locks: new Map([['driver-1', 'ride-1']]),
    driverStatus: new Map([['driver-1', 'busy']]),
    events: [],
    matching,
  };
}

describe('ride-state guards', () => {
  it('allows matched callback only on pre-terminal and already-matched rides', () => {
    expect(canApplyMatchedCallback('REQUESTED')).toBe(true);
    expect(canApplyMatchedCallback('MATCHING')).toBe(true);
    expect(canApplyMatchedCallback('MATCHED')).toBe(true);
    expect(canApplyMatchedCallback('COMPLETED')).toBe(false);
    expect(canApplyMatchedCallback('NO_DRIVERS')).toBe(false);
    expect(canApplyMatchedCallback('CANCELLED')).toBe(false);
  });

  it('does not mark NO_DRIVERS after a ride has already matched or finished', () => {
    expect(canApplyNoDriversCallback('MATCHING')).toBe(true);
    expect(canApplyNoDriversCallback('MATCHED')).toBe(false);
    expect(canApplyNoDriversCallback('COMPLETED')).toBe(false);
  });

  it('compensates only the accept path when matching fails', () => {
    expect(shouldCompensateAcceptOnMatchingFailure(true)).toBe(true);
    expect(shouldCompensateAcceptOnMatchingFailure(false)).toBe(false);
  });
});

describe('respondToDriverOffer', () => {
  it('rolls back a late accept so the driver is not stuck busy', async () => {
    const world = seededOfferWorld({
      ok: false,
      status: 422,
      body: { error: 'TaskTimedOut', message: 'Offer has already expired' },
    });
    const result = await respondToDriverOffer(
      createFake(world),
      'ride-1',
      'driver-1',
      true,
    );

    expect(result.httpStatus).toBe(422);
    expect(world.offers.get('offer-1')?.status).toBe('TIMED_OUT');
    expect(world.locks.has('driver-1')).toBe(false);
    expect(world.driverStatus.get('driver-1')).toBe('available');
    expect(world.events.map((event) => event.type)).toEqual([
      'offer.timeout',
      'lock.released',
    ]);
  });

  it('frees the driver when matching is unreachable after accept', async () => {
    const world = seededOfferWorld(new Error('ECONNREFUSED'));
    const result = await respondToDriverOffer(
      createFake(world),
      'ride-1',
      'driver-1',
      true,
    );

    expect(result.httpStatus).toBe(503);
    expect(world.offers.get('offer-1')?.status).toBe('TIMED_OUT');
    expect(world.driverStatus.get('driver-1')).toBe('available');
    expect(world.locks.has('driver-1')).toBe(false);
  });

  it('keeps the lock when matching confirms an accept', async () => {
    const world = seededOfferWorld({
      ok: true,
      status: 200,
      body: { ok: true },
    });
    const result = await respondToDriverOffer(
      createFake(world),
      'ride-1',
      'driver-1',
      true,
    );

    expect(result.httpStatus).toBe(200);
    expect(world.offers.get('offer-1')?.status).toBe('ACCEPTED');
    expect(world.locks.get('driver-1')).toBe('ride-1');
    expect(world.driverStatus.get('driver-1')).toBe('busy');
    expect(world.events.map((event) => event.type)).toEqual(['offer.accepted']);
  });

  it('releases the lock on decline even if matching later fails', async () => {
    const world = seededOfferWorld({
      ok: false,
      status: 422,
      body: { error: 'TaskTimedOut' },
    });
    const result = await respondToDriverOffer(
      createFake(world),
      'ride-1',
      'driver-1',
      false,
    );

    expect(result.httpStatus).toBe(422);
    expect(world.offers.get('offer-1')?.status).toBe('DECLINED');
    expect(world.locks.has('driver-1')).toBe(false);
    expect(world.driverStatus.get('driver-1')).toBe('available');
  });
});

describe('applyRideMatched', () => {
  it('does not resurrect a completed ride or re-busy the driver', async () => {
    const world = seededOfferWorld({ ok: true, status: 200, body: {} });
    world.rides.set('ride-1', {
      id: 'ride-1',
      status: 'COMPLETED',
      driverId: 'driver-1',
    });
    world.locks.clear();
    world.driverStatus.set('driver-1', 'available');

    const result = await applyRideMatched(
      createFake(world),
      'ride-1',
      'driver-1',
      3600,
    );

    expect(result.applied).toBe(false);
    expect(world.rides.get('ride-1')?.status).toBe('COMPLETED');
    expect(world.driverStatus.get('driver-1')).toBe('available');
    expect(world.events).toEqual([]);
  });

  it('is a no-op for NO_DRIVERS so a late callback cannot clobber the terminal state', async () => {
    const world = seededOfferWorld({ ok: true, status: 200, body: {} });
    world.rides.set('ride-1', {
      id: 'ride-1',
      status: 'NO_DRIVERS',
      driverId: null,
    });

    const result = await applyRideMatched(
      createFake(world),
      'ride-1',
      'driver-1',
      3600,
    );

    expect(result.applied).toBe(false);
    expect(world.rides.get('ride-1')?.status).toBe('NO_DRIVERS');
  });

  it('marks an in-progress ride MATCHED', async () => {
    const world = seededOfferWorld({ ok: true, status: 200, body: {} });
    const result = await applyRideMatched(
      createFake(world),
      'ride-1',
      'driver-1',
      3600,
    );

    expect(result.applied).toBe(true);
    expect(world.rides.get('ride-1')).toEqual({
      id: 'ride-1',
      status: 'MATCHED',
      driverId: 'driver-1',
    });
    expect(world.driverStatus.get('driver-1')).toBe('busy');
  });
});

describe('completeRide', () => {
  it('writes COMPLETED before releasing the driver', async () => {
    const world = seededOfferWorld({ ok: true, status: 200, body: {} });
    world.rides.set('ride-1', {
      id: 'ride-1',
      status: 'MATCHED',
      driverId: 'driver-1',
    });

    const result = await completeRide(createFake(world), 'ride-1');

    expect(result.httpStatus).toBe(200);
    expect(world.rides.get('ride-1')?.status).toBe('COMPLETED');
    expect(world.locks.has('driver-1')).toBe(false);
    expect(world.driverStatus.get('driver-1')).toBe('available');
  });

  it('still frees the driver on a repeated complete', async () => {
    const world = seededOfferWorld({ ok: true, status: 200, body: {} });
    world.rides.set('ride-1', {
      id: 'ride-1',
      status: 'COMPLETED',
      driverId: 'driver-1',
    });

    const result = await completeRide(createFake(world), 'ride-1');

    expect(result.httpStatus).toBe(200);
    expect(world.locks.has('driver-1')).toBe(false);
    expect(world.driverStatus.get('driver-1')).toBe('available');
  });
});

describe('applyNoDrivers', () => {
  it('does not overwrite a MATCHED ride', async () => {
    const world = seededOfferWorld({ ok: true, status: 200, body: {} });
    world.rides.set('ride-1', {
      id: 'ride-1',
      status: 'MATCHED',
      driverId: 'driver-1',
    });

    const result = await applyNoDrivers(createFake(world), 'ride-1');

    expect(result.applied).toBe(false);
    expect(world.rides.get('ride-1')?.status).toBe('MATCHED');
  });
});
