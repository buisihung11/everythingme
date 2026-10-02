import { describe, expect, it } from 'vitest';
import {
  CreateRideSchema,
  DomainEventSchema,
  FareEstimateRequestSchema,
  RespondToOfferSchema,
} from './index';

describe('CreateRideSchema', () => {
  it('requires rider and both locations', () => {
    const result = CreateRideSchema.safeParse({
      riderId: 'r1',
      pickup: { lat: 1, lng: 2 },
      dropoff: { lat: 3, lng: 4, address: 'Mission' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty riderId', () => {
    expect(
      CreateRideSchema.safeParse({
        riderId: '',
        pickup: { lat: 1, lng: 2 },
        dropoff: { lat: 3, lng: 4 },
      }).success,
    ).toBe(false);
  });
});

describe('FareEstimateRequestSchema', () => {
  it('accepts pickup and dropoff without rider', () => {
    expect(
      FareEstimateRequestSchema.safeParse({
        pickup: { lat: 37.77, lng: -122.42 },
        dropoff: { lat: 37.76, lng: -122.41 },
      }).success,
    ).toBe(true);
  });
});

describe('RespondToOfferSchema', () => {
  it('requires boolean accept flag', () => {
    expect(RespondToOfferSchema.safeParse({ accept: true }).success).toBe(true);
    expect(RespondToOfferSchema.safeParse({}).success).toBe(false);
  });
});

describe('DomainEventSchema lock events', () => {
  it('parses lock denied with heldBy ride reference', () => {
    const parsed = DomainEventSchema.safeParse({
      type: 'lock.denied',
      rideId: 'ride-a',
      driverId: 'd1',
      heldBy: 'ride-b',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.type).toBe('lock.denied');
      expect(parsed.data.heldBy).toBe('ride-b');
    }
  });

  it('parses ride.completed for driver release after trip', () => {
    const parsed = DomainEventSchema.safeParse({
      type: 'ride.completed',
      rideId: 'ride-a',
      driverId: 'd1',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects unknown event types', () => {
    expect(
      DomainEventSchema.safeParse({
        type: 'lock.unknown',
        rideId: 'ride-a',
        driverId: 'd1',
      }).success,
    ).toBe(false);
  });
});
