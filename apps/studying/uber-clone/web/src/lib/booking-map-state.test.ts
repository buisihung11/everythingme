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

const driverNearPickup: DriverInfo = {
  id: 'driver-1',
  name: 'Ada',
  lat: 37.79,
  lng: -122.42,
  status: 'available',
};

function eventsForMatchedRide(rideId: string): AnyEvent[] {
  return [
    { type: 'ride.created', rideId },
    { type: 'offer.created', rideId, driverId: 'driver-1', offerId: 'o1' },
    { type: 'offer.accepted', rideId, driverId: 'driver-1', offerId: 'o1' },
    { type: 'ride.matched', rideId, driverId: 'driver-1' },
  ];
}

describe('ride lane helpers', () => {
  it('assigns lane B only to the second tracked ride', () => {
    const rideIds = ['ride-a', 'ride-b'];
    expect(rideLaneFor(rideIds, 'ride-a')).toBe('a');
    expect(rideLaneFor(rideIds, 'ride-b')).toBe('b');
    expect(rideLaneTitle(rideIds, 'ride-b')).toBe('Ride B');
  });

  it('returns null titles when only one ride is active', () => {
    expect(rideLaneTitle(['ride-a'], 'ride-a')).toBeNull();
  });
});

describe('deriveBookingMapState', () => {
  it('draws an offer line while a driver is being offered the ride', () => {
    const rideId = 'ride-1';
    const sseEvents: AnyEvent[] = [
      { type: 'ride.created', rideId },
      { type: 'offer.created', rideId, driverId: 'driver-1', offerId: 'o1' },
    ];

    const model = deriveBookingMapState({
      route,
      drivers: [driverNearPickup],
      sseEvents,
      rideIds: [rideId],
    });

    expect(model.showSearchRadius).toBe(true);
    expect(model.offerLines).toHaveLength(1);
    expect(model.offerLines[0].points[1]).toEqual(route.pickup);
    expect(model.drivers[0]).toMatchObject({
      id: 'driver-1',
      pinStatus: 'offering',
    });
    expect(model.statusLabel).toContain('Ada');
  });

  it('shows en-route and trip lines after a match', () => {
    const rideId = 'ride-1';
    const model = deriveBookingMapState({
      route,
      drivers: [{ ...driverNearPickup, status: 'busy' }],
      sseEvents: eventsForMatchedRide(rideId),
      rideIds: [rideId],
    });

    expect(model.enRouteLines).toHaveLength(1);
    expect(model.tripLines).toHaveLength(1);
    expect(model.showPreviewRoute).toBe(false);
    expect(model.drivers[0].pinStatus).toBe('matched');
    expect(model.statusLabel).toContain('on the way');
  });

  it('clears matched visuals and frees the driver after ride.completed', () => {
    const rideId = 'ride-1';
    const sseEvents: AnyEvent[] = [
      ...eventsForMatchedRide(rideId),
      { type: 'ride.completed', rideId, driverId: 'driver-1' },
    ];

    const model = deriveBookingMapState({
      route,
      drivers: [{ ...driverNearPickup, status: 'available' }],
      sseEvents,
      rideIds: [rideId],
    });

    expect(model.enRouteLines).toHaveLength(0);
    expect(model.tripLines).toHaveLength(0);
    expect(model.showPreviewRoute).toBe(true);
    expect(model.drivers[0].pinStatus).toBe('available');
    expect(model.statusLabel).toContain('available again');
  });

  it('draws lock lines for held drivers that are not yet offering', () => {
    const rideId = 'ride-1';
    const model = deriveBookingMapState({
      route,
      drivers: [driverNearPickup],
      sseEvents: [
        { type: 'ride.created', rideId },
        { type: 'lock.acquired', rideId, driverId: 'driver-1' },
      ],
      rideIds: [rideId],
      locks: [{ driverId: 'driver-1', rideId, ttlSeconds: 90 }],
    });

    expect(model.lockLines).toHaveLength(1);
    expect(model.offerLines).toHaveLength(0);
  });

  it('summarizes both rides during a lock race', () => {
    const rideA = 'ride-a';
    const rideB = 'ride-b';
    const model = deriveBookingMapState({
      route,
      drivers: [driverNearPickup],
      sseEvents: [
        { type: 'ride.created', rideId: rideA },
        { type: 'ride.created', rideId: rideB },
        { type: 'offer.created', rideId: rideA, driverId: 'driver-1', offerId: 'o1' },
      ],
      rideIds: [rideA, rideB],
    });

    expect(model.isRace).toBe(true);
    expect(model.statusLabel).toMatch(/Ride A offering Ada/);
    expect(model.statusLabel).toMatch(/Ride B searching/);
  });
});
