import { describe, expect, it } from 'vitest';
import {
  isLockEvent,
  resolveDriverLocks,
  type AnyEvent,
  type LockInfo,
} from './lock-types';

describe('isLockEvent', () => {
  it('recognizes lock SSE events', () => {
    expect(
      isLockEvent({
        type: 'lock.acquired',
        rideId: 'ride-1',
        driverId: 'd1',
      }),
    ).toBe(true);
    expect(
      isLockEvent({
        type: 'lock.denied',
        rideId: 'ride-1',
        driverId: 'd1',
        heldBy: 'ride-2',
      }),
    ).toBe(true);
    expect(
      isLockEvent({
        type: 'lock.released',
        rideId: 'ride-1',
        driverId: 'd1',
      }),
    ).toBe(true);
  });

  it('rejects ride domain events', () => {
    expect(
      isLockEvent({ type: 'ride.matched', rideId: 'ride-1', driverId: 'd1' }),
    ).toBe(false);
  });
});

describe('resolveDriverLocks', () => {
  const polled: LockInfo[] = [
    { driverId: 'd1', rideId: 'ride-a', ttlSeconds: 42 },
  ];

  it('merges polled locks, driver hashes, and SSE in order', () => {
    const drivers = [{ id: 'd2', lockRideId: 'ride-b' }];
    const sse: AnyEvent[] = [
      {
        type: 'lock.acquired',
        rideId: 'ride-c',
        driverId: 'd3',
      },
    ];

    const locks = resolveDriverLocks(polled, drivers, sse);

    expect(locks.d1).toEqual({ driverId: 'd1', rideId: 'ride-a', ttlSeconds: 42 });
    expect(locks.d2).toEqual({
      driverId: 'd2',
      rideId: 'ride-b',
      ttlSeconds: null,
    });
    expect(locks.d3).toEqual({
      driverId: 'd3',
      rideId: 'ride-c',
      ttlSeconds: null,
    });
  });

  it('SSE lock.acquired overrides polled rideId but keeps TTL when present', () => {
    const sse: AnyEvent[] = [
      { type: 'lock.acquired', rideId: 'ride-new', driverId: 'd1' },
    ];

    const locks = resolveDriverLocks(polled, [], sse);
    expect(locks.d1).toEqual({
      driverId: 'd1',
      rideId: 'ride-new',
      ttlSeconds: 42,
    });
  });

  it('SSE lock.released removes the driver entry', () => {
    const sse: AnyEvent[] = [
      { type: 'lock.released', rideId: 'ride-a', driverId: 'd1' },
    ];

    expect(resolveDriverLocks(polled, [], sse)).toEqual({});
  });

  it('does not duplicate driver hash when polled lock already exists', () => {
    const drivers = [{ id: 'd1', lockRideId: 'ride-stale' }];
    expect(resolveDriverLocks(polled, drivers, [])).toEqual({
      d1: { driverId: 'd1', rideId: 'ride-a', ttlSeconds: 42 },
    });
  });
});
