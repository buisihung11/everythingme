import { z } from 'zod';

// ── Driver ──────────────────────────────────────────────────────────────────

export const DriverStatusSchema = z.enum([
  'available',
  'busy',
  'offline',
]);
export type DriverStatus = z.infer<typeof DriverStatusSchema>;

export const DriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  status: DriverStatusSchema,
  distanceKm: z.number().optional(),
});
export type Driver = z.infer<typeof DriverSchema>;

// ── Ride ────────────────────────────────────────────────────────────────────

export const RideStatusSchema = z.enum([
  'REQUESTED',
  'MATCHING',
  'MATCHED',
  'COMPLETED',
  'NO_DRIVERS',
  'CANCELLED',
]);
export type RideStatus = z.infer<typeof RideStatusSchema>;

export const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
});
export type Location = z.infer<typeof LocationSchema>;

export const RideSchema = z.object({
  id: z.string(),
  riderId: z.string(),
  pickup: LocationSchema,
  dropoff: LocationSchema,
  status: RideStatusSchema,
  fareEstimate: z.number(),
  driverId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Ride = z.infer<typeof RideSchema>;

export const CreateRideSchema = z.object({
  riderId: z.string().min(1),
  pickup: LocationSchema,
  dropoff: LocationSchema,
});
export type CreateRide = z.infer<typeof CreateRideSchema>;

export const FareEstimateRequestSchema = z.object({
  pickup: LocationSchema,
  dropoff: LocationSchema,
});

export const FareEstimateResponseSchema = z.object({
  fareEstimate: z.number(),
  distanceKm: z.number(),
  etaMinutes: z.number(),
});

// ── Offer ───────────────────────────────────────────────────────────────────

export const OfferStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'TIMED_OUT',
]);
export type OfferStatus = z.infer<typeof OfferStatusSchema>;

export const RideOfferSchema = z.object({
  id: z.string(),
  rideId: z.string(),
  driverId: z.string(),
  status: OfferStatusSchema,
  createdAt: z.string(),
});
export type RideOffer = z.infer<typeof RideOfferSchema>;

export const RespondToOfferSchema = z.object({
  accept: z.boolean(),
});

// ── Domain Events ────────────────────────────────────────────────────────────

export const DomainEventTypeSchema = z.enum([
  'ride.created',
  'ride.matching',
  'offer.created',
  'offer.accepted',
  'offer.declined',
  'offer.timeout',
  'ride.matched',
  'ride.completed',
  'ride.no_drivers',
  'lock.acquired',
  'lock.denied',
  'lock.released',
]);
export type DomainEventType = z.infer<typeof DomainEventTypeSchema>;

export const DomainEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ride.created'),
    rideId: z.string(),
    riderId: z.string(),
  }),
  z.object({
    type: z.literal('ride.matching'),
    rideId: z.string(),
  }),
  z.object({
    type: z.literal('offer.created'),
    rideId: z.string(),
    driverId: z.string(),
    offerIndex: z.number(),
  }),
  z.object({
    type: z.literal('offer.accepted'),
    rideId: z.string(),
    driverId: z.string(),
  }),
  z.object({
    type: z.literal('offer.declined'),
    rideId: z.string(),
    driverId: z.string(),
  }),
  z.object({
    type: z.literal('offer.timeout'),
    rideId: z.string(),
    driverId: z.string(),
  }),
  z.object({
    type: z.literal('ride.matched'),
    rideId: z.string(),
    driverId: z.string(),
  }),
  z.object({
    type: z.literal('ride.completed'),
    rideId: z.string(),
    driverId: z.string(),
  }),
  z.object({
    type: z.literal('ride.no_drivers'),
    rideId: z.string(),
  }),
  z.object({
    type: z.literal('lock.acquired'),
    rideId: z.string(),
    driverId: z.string(),
  }),
  z.object({
    type: z.literal('lock.denied'),
    rideId: z.string(),
    driverId: z.string(),
    heldBy: z.string(),
  }),
  z.object({
    type: z.literal('lock.released'),
    rideId: z.string(),
    driverId: z.string(),
  }),
]);
export type DomainEvent = z.infer<typeof DomainEventSchema>;

// ── Internal Callbacks ───────────────────────────────────────────────────────

export const OfferCallbackSchema = z.object({
  rideId: z.string(),
  driverId: z.string(),
  offerIndex: z.number(),
});

export const MatchedCallbackSchema = z.object({
  rideId: z.string(),
  driverId: z.string(),
});

export const NoDriversCallbackSchema = z.object({
  rideId: z.string(),
});

// ── State Machine Input ──────────────────────────────────────────────────────

export const StateMachineInputSchema = z.object({
  rideId: z.string(),
  pickup: LocationSchema,
  dropoff: LocationSchema,
  radiusKm: z.number().default(5),
});
export type StateMachineInput = z.infer<typeof StateMachineInputSchema>;
