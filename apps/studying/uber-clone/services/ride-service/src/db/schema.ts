import {
  pgTable,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

export const rides = pgTable('rides', {
  id: text('id').primaryKey(),
  riderId: text('rider_id').notNull(),
  pickupLat: numeric('pickup_lat', { precision: 10, scale: 7 }).notNull(),
  pickupLng: numeric('pickup_lng', { precision: 10, scale: 7 }).notNull(),
  pickupAddress: text('pickup_address'),
  dropoffLat: numeric('dropoff_lat', { precision: 10, scale: 7 }).notNull(),
  dropoffLng: numeric('dropoff_lng', { precision: 10, scale: 7 }).notNull(),
  dropoffAddress: text('dropoff_address'),
  status: text('status').notNull().default('REQUESTED'),
  fareEstimate: numeric('fare_estimate', { precision: 10, scale: 2 }).notNull(),
  driverId: text('driver_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const rideOffers = pgTable('ride_offers', {
  id: text('id').primaryKey(),
  rideId: text('ride_id')
    .notNull()
    .references(() => rides.id),
  driverId: text('driver_id').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING | ACCEPTED | DECLINED | TIMED_OUT
  offerIndex: integer('offer_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
