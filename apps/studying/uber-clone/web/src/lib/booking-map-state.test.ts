import { describe, expect, it } from 'vitest';
import type { DriverInfo } from '../hooks/use-drivers';
import type { AnyEvent } from './lock-types';
import {
  deriveBookingMapState,
  rideLaneFor,
  rideLaneTitle,
} from './booking-map-state';
import { ROUTE_PRESETS } from './route-presets';

const route = ROUTE_PRESETS[0];

function driver(
  id: string,
  overrides: Partial<DriverInfo> = {},
): DriverInfo {
  return {
    id,
    name: `Driver ${id}`,
    lat: route.pickup.lat + 0.01,
    lng: route.pickup.lng + 0.01,
    status: 'available',
    ...overrides,
  };
}

function derive(
  rideIds: string[],
  sseEvents: AnyEvent[],
  drivers: DriverInfo[] = [],
) {
  return deriveBookingMapState({
    route,
    drivers,
    sseEvents,
    rideIds,
  });
}

describe('rideLaneFor', () => {
  it('assigns lane a to the first ride and b to the second in a race', () => {
    expect(rideLaneFor(['ride-a', 'ride-b'], 'ride-a')).toBe('a');
    expect(rideLaneFor(['ride-a', 'ride-b'], 'ride-b')).toBe('b');
  });
});

describe('rideLaneTitle', () => {
  it('returns null for a single tracked ride', () => {
    expect(rideLaneTitle(['ride-a'], 'ride-a')).toBeNull();
  });

  it('labels rides A and B when two are tracked', () => {
    expect(rideLaneTitle(['ride-a', 'ride-b'], 'ride-b')).toBe('Ride B');
  });
});

describe('deriveBookingMapState', () => {
  it('prompts for a route when no rides are active', () => {
    const model = derive([], []);

    expect(model.statusLabel).toBe('Choose a route, then request a ride.');
    expect(model.showSearchRadius).toBe(false);
    expect(model.showPreviewRoute).toBe(true);
    expect(model.isRace).toBe(false);
  });

  it('shows search radius while matching', () => {
    const model = derive(
      ['ride-1'],
      [{ type: 'ride.matching', rideId: 'ride-1' }],
    );

    expect(model.statusLabel).toBe('Searching nearby drivers.');
    expect(model.showSearchRadius).toBe(true);
  });

  it('draws offer lines and offering pin status', () => {
    const d = driver('d1');
    const model = derive(
      ['ride-1'],
      [
        { type: 'ride.matching', rideId: 'ride-1' },
        { type: 'offer.created', rideId: 'ride-1', driverId: 'd1', offerIndex: 0 },
      ],
      [d],
    );

    expect(model.statusLabel).toBe('Offer waiting for Driver d1.');
    expect(model.offerLines).toHaveLength(1);
    expect(model.offerLines[0].points[1]).toEqual(route.pickup);
    expect(model.drivers[0].pinStatus).toBe('offering');
  });

  it('draws en-route and trip lines when matched', () => {
    const d = driver('d1');
    const model = derive(
      ['ride-1'],
      [{ type: 'ride.matched', rideId: 'ride-1', driverId: 'd1' }],
      [d],
    );

    expect(model.enRouteLines).toHaveLength(1);
    expect(model.tripLines).toHaveLength(1);
    expect(model.tripLines[0].points).toEqual([route.pickup, route.dropoff]);
    expect(model.showPreviewRoute).toBe(false);
    expect(model.drivers[0].pinStatus).toBe('matched');
  });

  it('marks trip complete and frees the driver pin', () => {
    const d = driver('d1');
    const model = derive(
      ['ride-1'],
      [
        { type: 'ride.matched', rideId: 'ride-1', driverId: 'd1' },
        { type: 'ride.completed', rideId: 'ride-1', driverId: 'd1' },
      ],
      [d],
    );

    expect(model.statusLabel).toBe('Trip complete. The driver is available again.');
    expect(model.tripLines).toHaveLength(0);
    expect(model.drivers[0].pinStatus).toBe('available');
  });

  it('summarizes both lanes in race mode', () => {
    const model = derive(
      ['ride-a', 'ride-b'],
      [
        { type: 'ride.matching', rideId: 'ride-a' },
        { type: 'offer.created', rideId: 'ride-b', driverId: 'd2', offerIndex: 0 },
      ],
      [driver('d2')],
    );

    expect(model.isRace).toBe(true);
    expect(model.statusLabel).toContain('Ride A searching');
    expect(model.statusLabel).toContain('Ride B offering');
  });

  it('draws lock lines for held drivers not currently offering or matched', () => {
    const d = driver('d1');
    const model = deriveBookingMapState({
      route,
      drivers: [d],
      sseEvents: [],
      rideIds: ['ride-1'],
      locks: [{ driverId: 'd1', rideId: 'ride-1', ttlSeconds: 25 }],
    });

    expect(model.lockLines).toHaveLength(1);
    expect(model.offerLines).toHaveLength(0);
  });

  it('does not duplicate lock lines when the driver is already offering', () => {
    const d = driver('d1');
    const model = deriveBookingMapState({
      route,
      drivers: [d],
      sseEvents: [
        { type: 'offer.created', rideId: 'ride-1', driverId: 'd1', offerIndex: 0 },
      ],
      rideIds: ['ride-1'],
      locks: [{ driverId: 'd1', rideId: 'ride-1', ttlSeconds: 25 }],
    });

    expect(model.offerLines).toHaveLength(1);
    expect(model.lockLines).toHaveLength(0);
  });
});
