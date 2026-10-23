import { describe, expect, it } from 'vitest';
import type { AnyEvent, LockInfo } from './lock-types';
import { isLockEvent, resolveDriverLocks } from './lock-types';

describe('isLockEvent', () => {
  it('recognizes lock SSE event types', () => {
    expect(
      isLockEvent({
        type: 'lock.acquired',
        rideId: 'ride-1',
        driverId: 'driver-1',
      }),
    ).toBe(true);
    expect(
      isLockEvent({
        type: 'lock.denied',
        rideId: 'ride-1',
        driverId: 'driver-1',
        heldBy: 'ride-0',
      }),
    ).toBe(true);
    expect(
      isLockEvent({ type: 'ride.matched', rideId: 'ride-1', driverId: 'd1' }),
    ).toBe(false);
  });
});

describe('resolveDriverLocks', () => {
  const polled: LockInfo[] = [
    { driverId: 'd1', rideId: 'ride-a', ttlSeconds: 30 },
  ];

  it('starts from polled locks and merges driver hash fallbacks', () => {
    const resolved = resolveDriverLocks(
      polled,
      [{ id: 'd2', lockRideId: 'ride-b' }],
      [],
    );

    expect(resolved.d1).toEqual(polled[0]);
    expect(resolved.d2).toEqual({
      driverId: 'd2',
      rideId: 'ride-b',
      ttlSeconds: null,
    });
  });

  it('applies SSE acquire and release in order', () => {
    const events: AnyEvent[] = [
      { type: 'lock.acquired', rideId: 'ride-new', driverId: 'd1' },
      { type: 'lock.released', rideId: 'ride-new', driverId: 'd1' },
      { type: 'lock.acquired', rideId: 'ride-final', driverId: 'd1' },
    ];

    const resolved = resolveDriverLocks(polled, [], events);

    expect(resolved.d1?.rideId).toBe('ride-final');
  });

  it('drops a driver when the latest SSE event is lock.released', () => {
    const events: AnyEvent[] = [
      { type: 'lock.acquired', rideId: 'ride-x', driverId: 'd1' },
      { type: 'lock.released', rideId: 'ride-x', driverId: 'd1' },
    ];

    expect(resolveDriverLocks(undefined, [], events).d1).toBeUndefined();
  });
});
