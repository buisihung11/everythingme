import { describe, expect, it } from 'vitest';
import type { AnyEvent } from './lock-types';
import { isLockEvent, resolveDriverLocks } from './lock-types';

describe('isLockEvent', () => {
  it('recognizes lock SSE payloads', () => {
    expect(
      isLockEvent({ type: 'lock.acquired', rideId: 'r1', driverId: 'd1' }),
    ).toBe(true);
    expect(
      isLockEvent({
        type: 'lock.denied',
        rideId: 'r1',
        driverId: 'd1',
        heldBy: 'r0',
      }),
    ).toBe(true);
    expect(
      isLockEvent({ type: 'lock.released', rideId: 'r1', driverId: 'd1' }),
    ).toBe(true);
  });

  it('rejects ride domain events', () => {
    const rideEvent: AnyEvent = {
      type: 'offer.created',
      rideId: 'r1',
      driverId: 'd1',
      offerId: 'o1',
    };
    expect(isLockEvent(rideEvent)).toBe(false);
  });
});

describe('resolveDriverLocks', () => {
  const drivers = [
    { id: 'd1', lockRideId: 'ride-from-poll' },
    { id: 'd2' },
  ];

  it('merges polled locks, driver hashes, and SSE in order', () => {
    const locks = [{ driverId: 'd2', rideId: 'ride-from-api', ttlSeconds: 42 }];
    const sseEvents: AnyEvent[] = [
      { type: 'lock.acquired', rideId: 'ride-from-sse', driverId: 'd2' },
    ];

    const resolved = resolveDriverLocks(locks, drivers, sseEvents);

    expect(resolved.d1).toEqual({
      driverId: 'd1',
      rideId: 'ride-from-poll',
      ttlSeconds: null,
    });
    expect(resolved.d2).toEqual({
      driverId: 'd2',
      rideId: 'ride-from-sse',
      ttlSeconds: 42,
    });
  });

  it('drops a driver when lock.released arrives on the stream', () => {
    const sseEvents: AnyEvent[] = [
      { type: 'lock.acquired', rideId: 'r1', driverId: 'd1' },
      { type: 'lock.released', rideId: 'r1', driverId: 'd1' },
    ];

    expect(resolveDriverLocks([], drivers, sseEvents)).toEqual({});
  });
});
