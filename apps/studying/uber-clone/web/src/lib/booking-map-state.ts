/**
 * Derives what the booking map should draw from the selected route,
 * polled driver positions, and the SSE event stream.
 */

import type { DriverInfo } from '../hooks/use-drivers';
import type { AnyEvent, LockInfo } from './lock-types';
import { resolveDriverLocks } from './lock-types';
import type { RoutePreset } from './route-presets';

/** Matches the GEOSEARCH radius in fetch-candidates.worker.ts */
export const SEARCH_RADIUS_KM = 5;

export type RideLane = 'a' | 'b';
export type RidePhase = 'matching' | 'offering' | 'matched' | 'completed' | 'no_drivers';
export type DriverPinStatus = 'available' | 'busy' | 'offering' | 'skipped' | 'matched';

export const RIDE_LANE_COLORS: Record<RideLane, string> = {
  a: '#2563eb',
  b: '#d97706',
};

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DriverPin extends LatLng {
  id: string;
  name: string;
  pinStatus: DriverPinStatus;
  rideLane?: RideLane;
}

interface RideVisual {
  rideId: string;
  lane: RideLane;
  phase: RidePhase;
  offeringDriverId?: string;
  matchedDriverId?: string;
  skippedDriverIds: string[];
}

export interface MapLine {
  id: string;
  points: LatLng[];
  color: string;
}

export interface BookingMapModel {
  statusLabel: string;
  showSearchRadius: boolean;
  isRace: boolean;
  drivers: DriverPin[];
  offerLines: MapLine[];
  lockLines: MapLine[];
  enRouteLines: MapLine[];
  tripLines: MapLine[];
  showPreviewRoute: boolean;
}

export function rideLaneFor(rideIds: string[], rideId: string): RideLane {
  return rideIds[1] === rideId ? 'b' : 'a';
}

/** Race label such as "Ride A", or null when only one ride is tracked. */
export function rideLaneTitle(rideIds: string[], rideId: string): string | null {
  if (rideIds.length < 2) return null;
  const index = rideIds.indexOf(rideId);
  if (index < 0) return rideId.slice(0, 8);
  return `Ride ${String.fromCharCode(65 + index)}`;
}

function deriveRideVisual(rideId: string, lane: RideLane, events: AnyEvent[]): RideVisual {
  const visual: RideVisual = {
    rideId,
    lane,
    phase: 'matching',
    skippedDriverIds: [],
  };

  for (const event of events) {
    if (!('rideId' in event) || event.rideId !== rideId) continue;

    switch (event.type) {
      case 'ride.created':
      case 'ride.matching':
        if (visual.phase !== 'matched' && visual.phase !== 'completed' && visual.phase !== 'no_drivers') {
          visual.phase = 'matching';
        }
        break;
      case 'offer.created':
        visual.offeringDriverId = event.driverId;
        visual.phase = 'offering';
        break;
      case 'offer.declined':
      case 'offer.timeout':
        if (!visual.skippedDriverIds.includes(event.driverId)) {
          visual.skippedDriverIds.push(event.driverId);
        }
        if (visual.offeringDriverId === event.driverId) {
          visual.offeringDriverId = undefined;
        }
        if (visual.phase === 'offering') {
          visual.phase = 'matching';
        }
        break;
      case 'offer.accepted':
      case 'ride.matched':
        visual.matchedDriverId = event.driverId;
        visual.offeringDriverId = undefined;
        visual.phase = 'matched';
        break;
      case 'ride.completed':
        visual.offeringDriverId = undefined;
        visual.matchedDriverId = undefined;
        visual.phase = 'completed';
        break;
      case 'ride.no_drivers':
        visual.offeringDriverId = undefined;
        visual.phase = 'no_drivers';
        break;
    }
  }

  return visual;
}

function statusLabel(rides: RideVisual[], driverName: (id?: string) => string): string {
  if (rides.length === 0) {
    return 'Choose a route, then request a ride.';
  }

  if (rides.length === 1) {
    const [ride] = rides;
    switch (ride.phase) {
      case 'matching':
        return 'Searching nearby drivers.';
      case 'offering':
        return `Offer waiting for ${driverName(ride.offeringDriverId)}.`;
      case 'matched':
        return `${driverName(ride.matchedDriverId)} is on the way to pickup.`;
      case 'completed':
        return 'Trip complete. The driver is available again.';
      case 'no_drivers':
        return 'No drivers available.';
    }
  }

  const describe = (ride: RideVisual): string => {
    switch (ride.phase) {
      case 'matching':
        return 'searching';
      case 'offering':
        return `offering ${driverName(ride.offeringDriverId)}`;
      case 'matched':
        return `${driverName(ride.matchedDriverId)} on the way`;
      case 'completed':
        return 'completed';
      case 'no_drivers':
        return 'no drivers';
    }
  };

  return rides
    .map((ride, index) => `Ride ${String.fromCharCode(65 + index)} ${describe(ride)}`)
    .join(' · ');
}

function pinFor(driver: DriverInfo, rides: RideVisual[]): DriverPin {
  const base = { id: driver.id, name: driver.name, lat: driver.lat, lng: driver.lng };

  const matched = rides.find((ride) => ride.matchedDriverId === driver.id);
  if (matched) return { ...base, pinStatus: 'matched', rideLane: matched.lane };

  const offering = rides.find((ride) => ride.offeringDriverId === driver.id);
  if (offering) return { ...base, pinStatus: 'offering', rideLane: offering.lane };

  const skipped = rides.find((ride) => ride.skippedDriverIds.includes(driver.id));
  if (skipped) return { ...base, pinStatus: 'skipped', rideLane: skipped.lane };

  return { ...base, pinStatus: driver.status === 'busy' ? 'busy' : 'available' };
}

export function deriveBookingMapState(input: {
  route: RoutePreset;
  drivers: DriverInfo[];
  sseEvents: AnyEvent[];
  rideIds: string[];
  locks?: LockInfo[];
}): BookingMapModel {
  const { route, drivers, sseEvents, rideIds, locks } = input;
  const rides = rideIds.map((rideId) =>
    deriveRideVisual(rideId, rideLaneFor(rideIds, rideId), sseEvents),
  );
  const driversById = new Map(drivers.map((driver) => [driver.id, driver]));
  const driverName = (id?: string) =>
    id ? (driversById.get(id)?.name ?? id) : 'a driver';
  const positionOf = (id: string): LatLng | undefined => {
    const driver = driversById.get(id);
    return driver && { lat: driver.lat, lng: driver.lng };
  };

  const offerLines: MapLine[] = [];
  const enRouteLines: MapLine[] = [];
  const tripLines: MapLine[] = [];
  const offeringOrMatchedIds = new Set<string>();
  for (const ride of rides) {
    const color = RIDE_LANE_COLORS[ride.lane];

    if (ride.offeringDriverId) {
      offeringOrMatchedIds.add(ride.offeringDriverId);
      const from = positionOf(ride.offeringDriverId);
      if (from) {
        offerLines.push({
          id: `offer-${ride.rideId}-${ride.offeringDriverId}`,
          points: [from, route.pickup],
          color,
        });
      }
    }

    if (ride.matchedDriverId && ride.phase === 'matched') {
      offeringOrMatchedIds.add(ride.matchedDriverId);
      const from = positionOf(ride.matchedDriverId);
      if (from) {
        enRouteLines.push({
          id: `enroute-${ride.rideId}`,
          points: [from, route.pickup],
          color,
        });
        tripLines.push({
          id: `trip-${ride.rideId}`,
          points: [route.pickup, route.dropoff],
          color: '#111827',
        });
      }
    }
  }

  const lockLines: MapLine[] = [];
  const lockByDriver = resolveDriverLocks(locks, drivers, sseEvents);
  for (const [driverId, lock] of Object.entries(lockByDriver)) {
    if (!rideIds.includes(lock.rideId) || offeringOrMatchedIds.has(driverId)) continue;
    const from = positionOf(driverId);
    if (!from) continue;
    lockLines.push({
      id: `lock-${lock.rideId}-${driverId}`,
      points: [from, route.pickup],
      color: RIDE_LANE_COLORS[rideLaneFor(rideIds, lock.rideId)],
    });
  }

  return {
    statusLabel: statusLabel(rides, driverName),
    showSearchRadius: rides.some(
      (ride) => ride.phase === 'matching' || ride.phase === 'offering',
    ),
    isRace: rideIds.length > 1,
    drivers: drivers.map((driver) => pinFor(driver, rides)),
    offerLines,
    lockLines,
    enRouteLines,
    tripLines,
    showPreviewRoute: tripLines.length === 0,
  };
}
