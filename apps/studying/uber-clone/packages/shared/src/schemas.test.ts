import { describe, expect, it } from 'vitest';
import {
  CreateRideSchema,
  DomainEventSchema,
  RideStatusSchema,
} from './index';

describe('CreateRideSchema', () => {
  it('rejects empty rider id', () => {
    const result = CreateRideSchema.safeParse({
      riderId: '',
      pickup: { lat: 1, lng: 2 },
      dropoff: { lat: 3, lng: 4 },
    });

    expect(result.success).toBe(false);
  });

  it('accepts a minimal valid create payload', () => {
    const result = CreateRideSchema.safeParse({
      riderId: 'rider-1',
      pickup: { lat: 37.78, lng: -122.41 },
      dropoff: { lat: 37.76, lng: -122.42 },
    });

    expect(result.success).toBe(true);
  });
});

describe('DomainEventSchema', () => {
  it('parses ride.completed events used to release driver locks in the lab UI', () => {
    const result = DomainEventSchema.safeParse({
      type: 'ride.completed',
      rideId: 'ride-1',
      driverId: 'driver-1',
    });

    expect(result.success).toBe(true);
  });

  it('rejects unknown event types', () => {
    const result = DomainEventSchema.safeParse({
      type: 'ride.unknown',
      rideId: 'ride-1',
    });

    expect(result.success).toBe(false);
  });
});

describe('RideStatusSchema', () => {
  it('includes COMPLETED for the complete-ride API path', () => {
    expect(RideStatusSchema.safeParse('COMPLETED').success).toBe(true);
    expect(RideStatusSchema.safeParse('MATCHED').success).toBe(true);
  });
});
