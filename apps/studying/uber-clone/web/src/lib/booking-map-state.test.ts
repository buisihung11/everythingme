import { describe, expect, it } from 'vitest';
import type { DriverInfo } from '../hooks/use-drivers';
import type { AnyEvent } from './lock-types';
import { ROUTE_PRESETS } from './route-presets';
import {
  deriveBookingMapState,
  rideLaneFor,
  rideLaneTitle,
  SEARCH_RADIUS_KM,
} from './booking-map-state';

const route = ROUTE_PRESETS[0];

function driver(
  id: string,
  overrides: Partial<DriverInfo> = {},
): DriverInfo {
  return {
    id,
    name: `Driver ${id}`,
    lat: 37.78,
    lng: -122.41,
    status: 'available',
    ...overrides,
  };
}

describe('rideLaneFor / rideLaneTitle', () => {
  it('assigns lane b only to the second tracked ride', () => {
    const ids = ['ride-a', 'ride-b'];
    expect(rideLaneFor(ids, 'ride-a')).toBe('a');
    expect(rideLaneFor(ids, 'ride-b')).toBe('b');
    expect(rideLaneFor(['solo'], 'solo')).toBe('a');
  });

  it('returns human-readable race titles', () => {
    const ids = ['ride-a', 'ride-b'];
    expect(rideLaneTitle(ids, 'ride-a')).toBe('Ride A');
    expect(rideLaneTitle(ids, 'ride-b')).toBe('Ride B');
    expect(rideLaneTitle(['solo'], 'solo')).toBeNull();
  });
});

describe('deriveBookingMapState', () => {
  const base = {
    route,
    drivers: [driver('d1'), driver('d2', { status: 'busy' })],
    rideIds: [] as string[],
    sseEvents: [] as AnyEvent[],
  };

  it('shows idle copy and preview route before any ride is requested', () => {
    const model = deriveBookingMapState(base);
    expect(model.statusLabel).toBe('Choose a route, then request a ride.');
    expect(model.showPreviewRoute).toBe(true);
    expect(model.showSearchRadius).toBe(false);
    expect(model.isRace).toBe(false);
    expect(model.drivers.map((d) => d.pinStatus)).toEqual(['available', 'busy']);
  });

  it('draws an offer line while waiting on a driver response', () => {
    const rideId = 'ride-1';
    const model = deriveBookingMapState({
      ...base,
      rideIds: [rideId],
      sseEvents: [
        { type: 'ride.matching', rideId },
        { type: 'offer.created', rideId, driverId: 'd1', offerIndex: 0 },
      ],
    });

    expect(model.statusLabel).toContain('Offer waiting');
    expect(model.showSearchRadius).toBe(true);
    expect(model.offerLines).toHaveLength(1);
    expect(model.offerLines[0].points[1]).toEqual(route.pickup);
    expect(model.showPreviewRoute).toBe(true);
    expect(model.drivers.find((d) => d.id === 'd1')?.pinStatus).toBe('offering');
  });

  it('shows en-route and trip lines after match, then clears on completion', () => {
    const rideId = 'ride-1';
    const matchedEvents: AnyEvent[] = [
      { type: 'offer.accepted', rideId, driverId: 'd1' },
      { type: 'ride.matched', rideId, driverId: 'd1' },
    ];

    const matched = deriveBookingMapState({
      ...base,
      rideIds: [rideId],
      sseEvents: matchedEvents,
    });
    expect(matched.enRouteLines).toHaveLength(1);
    expect(matched.tripLines).toHaveLength(1);
    expect(matched.tripLines[0].points).toEqual([route.pickup, route.dropoff]);
    expect(matched.showPreviewRoute).toBe(false);
    expect(matched.drivers.find((d) => d.id === 'd1')?.pinStatus).toBe('matched');

    const completed = deriveBookingMapState({
      ...base,
      rideIds: [rideId],
      sseEvents: [...matchedEvents, { type: 'ride.completed', rideId, driverId: 'd1' }],
    });
    expect(completed.statusLabel).toContain('Trip complete');
    expect(completed.enRouteLines).toHaveLength(0);
    expect(completed.tripLines).toHaveLength(0);
    expect(completed.showPreviewRoute).toBe(true);
  });

  it('marks declined drivers as skipped and returns to matching search radius', () => {
    const rideId = 'ride-1';
    const model = deriveBookingMapState({
      ...base,
      rideIds: [rideId],
      sseEvents: [
        { type: 'offer.created', rideId, driverId: 'd1', offerIndex: 0 },
        { type: 'offer.declined', rideId, driverId: 'd1' },
        { type: 'ride.matching', rideId },
      ],
    });

    expect(model.drivers.find((d) => d.id === 'd1')?.pinStatus).toBe('skipped');
    expect(model.showSearchRadius).toBe(true);
    expect(model.offerLines).toHaveLength(0);
  });

  it('draws lock lines for held drivers not yet in offer/matched visuals', () => {
    const rideId = 'ride-1';
    const model = deriveBookingMapState({
      ...base,
      rideIds: [rideId],
      sseEvents: [{ type: 'lock.acquired', rideId, driverId: 'd2' }],
      locks: [{ driverId: 'd2', rideId, ttlSeconds: 30 }],
    });

    expect(model.lockLines).toHaveLength(1);
    expect(model.lockLines[0].points[0]).toEqual({ lat: 37.78, lng: -122.41 });
    expect(model.offerLines).toHaveLength(0);
  });

  it('summarizes two concurrent rides in race mode', () => {
    const [rideA, rideB] = ['ride-a', 'ride-b'];
    const model = deriveBookingMapState({
      ...base,
      rideIds: [rideA, rideB],
      sseEvents: [
        { type: 'ride.matching', rideId: rideA },
        { type: 'offer.created', rideId: rideB, driverId: 'd2', offerIndex: 0 },
      ],
    });

    expect(model.isRace).toBe(true);
    expect(model.statusLabel).toContain('Ride A searching');
    expect(model.statusLabel).toContain('Ride B offering');
  });

  it('exports the same search radius constant as the fetch-candidates worker', () => {
    expect(SEARCH_RADIUS_KM).toBe(5);
  });
});
