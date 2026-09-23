import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { eq, and, sql as rawSql } from 'drizzle-orm';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import {
  CreateRideSchema,
  FareEstimateRequestSchema,
  RespondToOfferSchema,
  OfferCallbackSchema,
  MatchedCallbackSchema,
  NoDriversCallbackSchema,
} from '@studying/uber-clone/shared';
import { db, schema } from './db/client.js';
import { publish, subscribe } from './event-bus.js';
import {
  setDriverStatus,
  acquireDriverLock,
  releaseDriverLock,
  extendDriverLock,
} from './location-client.js';

const MATCHING_URL =
  process.env.MATCHING_URL ?? 'http://localhost:4402';

/** Offer-window lock TTL (seconds). Covers 15s SFN timeout + safety buffer. */
const OFFER_LOCK_TTL = 30;
/** Matched-ride lock TTL (seconds). Extended on accept; no "complete ride" in this lab. */
const MATCHED_LOCK_TTL = 3600;

/**
 * Mark any still-pending offers on this ride as timed out, release their locks,
 * and free those drivers.
 */
async function expirePendingOffers(
  rideId: string,
  exceptDriverId?: string,
): Promise<void> {
  const pending = await db.query.rideOffers.findMany({
    where: and(
      eq(schema.rideOffers.rideId, rideId),
      eq(schema.rideOffers.status, 'PENDING'),
    ),
  });

  for (const offer of pending) {
    if (exceptDriverId && offer.driverId === exceptDriverId) continue;

    await db
      .update(schema.rideOffers)
      .set({ status: 'TIMED_OUT', updatedAt: new Date() })
      .where(eq(schema.rideOffers.id, offer.id));

    // Release lock BEFORE freeing driver so the driver is only re-acquirable
    // once the lock key is gone.
    await releaseDriverLock(offer.driverId, rideId);
    await setDriverStatus(offer.driverId, 'available');

    publish({ type: 'offer.timeout', rideId, driverId: offer.driverId });
    publish({ type: 'lock.released', rideId, driverId: offer.driverId });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateFare(distanceKm: number): number {
  const BASE_FARE = 2.5;
  const RATE_PER_KM = 1.75;
  return parseFloat((BASE_FARE + distanceKm * RATE_PER_KM).toFixed(2));
}

// ── App ───────────────────────────────────────────────────────────────────────

export const rideApp = new Hono();
rideApp.use('*', cors());

// POST /fares/estimate
rideApp.post(
  '/fares/estimate',
  zValidator('json', FareEstimateRequestSchema),
  (c) => {
    const { pickup, dropoff } = c.req.valid('json');
    const distanceKm = haversineKm(
      pickup.lat,
      pickup.lng,
      dropoff.lat,
      dropoff.lng,
    );
    return c.json({
      fareEstimate: estimateFare(distanceKm),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      etaMinutes: Math.ceil(distanceKm / 0.5),
    });
  },
);

// POST /rides
rideApp.post('/rides', zValidator('json', CreateRideSchema), async (c) => {
  const { riderId, pickup, dropoff } = c.req.valid('json');
  const distanceKm = haversineKm(
    pickup.lat,
    pickup.lng,
    dropoff.lat,
    dropoff.lng,
  );
  const fareEstimate = estimateFare(distanceKm);
  const id = randomUUID();
  const now = new Date();

  await db.insert(schema.rides).values({
    id,
    riderId,
    pickupLat: pickup.lat.toString(),
    pickupLng: pickup.lng.toString(),
    pickupAddress: pickup.address,
    dropoffLat: dropoff.lat.toString(),
    dropoffLng: dropoff.lng.toString(),
    dropoffAddress: dropoff.address,
    status: 'REQUESTED',
    fareEstimate: fareEstimate.toString(),
    createdAt: now,
    updatedAt: now,
  });

  publish({ type: 'ride.created', rideId: id, riderId });

  // Kick off matching asynchronously (fire-and-forget at this point)
  void triggerMatching(id, pickup, dropoff);

  const ride = await db.query.rides.findFirst({ where: eq(schema.rides.id, id) });
  return c.json({ ride: serializeRide(ride!) }, 201);
});

// GET /rides/:id
rideApp.get('/rides/:id', async (c) => {
  const { id } = c.req.param();
  const ride = await db.query.rides.findFirst({ where: eq(schema.rides.id, id) });
  if (!ride) return c.json({ error: 'not found' }, 404);
  return c.json({ ride: serializeRide(ride) });
});

// GET /rides/:id/offers
rideApp.get('/rides/:id/offers', async (c) => {
  const { id } = c.req.param();
  const offers = await db.query.rideOffers.findMany({
    where: eq(schema.rideOffers.rideId, id),
    orderBy: (t, { asc }) => [asc(t.offerIndex)],
  });
  return c.json({ offers: offers.map(serializeOffer) });
});

// POST /rides/:id/offers/:driverId/respond
rideApp.post(
  '/rides/:id/offers/:driverId/respond',
  zValidator('json', RespondToOfferSchema),
  async (c) => {
    const { id: rideId, driverId } = c.req.param();
    const { accept } = c.req.valid('json');

    // Guard: only allow transition from PENDING
    const offer = await db.query.rideOffers.findFirst({
      where: and(
        eq(schema.rideOffers.rideId, rideId),
        eq(schema.rideOffers.driverId, driverId),
        eq(schema.rideOffers.status, 'PENDING'),
      ),
    });
    if (!offer) {
      return c.json({ error: 'No pending offer found' }, 404);
    }

    const newStatus = accept ? 'ACCEPTED' : 'DECLINED';
    await db
      .update(schema.rideOffers)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(schema.rideOffers.id, offer.id));

    publish({
      type: accept ? 'offer.accepted' : 'offer.declined',
      rideId,
      driverId,
    });

    // Decline: release the lock, free the driver, and notify.
    // Accept: lock is extended to 1 h by /internal/rides/:id/matched; driver stays busy.
    if (!accept) {
      await releaseDriverLock(driverId, rideId);
      await setDriverStatus(driverId, 'available');
      publish({ type: 'lock.released', rideId, driverId });
    }

    // Forward to Matching Service
    const matchingRes = await fetch(
      `${MATCHING_URL}/matches/${rideId}/offers/${driverId}/respond`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accept }),
      },
    );

    const body = (await matchingRes.json()) as Record<string, unknown>;
    return c.json(body, matchingRes.ok ? 200 : (matchingRes.status as 422 | 500));
  },
);

// GET /events – SSE stream
rideApp.get('/events', (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // stream closed
        }
      };

      send(JSON.stringify({ type: 'connected' }));

      const unsubscribe = subscribe((event) => {
        send(JSON.stringify(event));
      });

      // Clean up when client disconnects
      c.req.raw.signal.addEventListener('abort', () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
});

// ── Internal endpoints (called by Matching Service) ───────────────────────────

const internal = new Hono();

// POST /internal/rides/:id/offers
internal.post(
  '/rides/:id/offers',
  zValidator('json', OfferCallbackSchema),
  async (c) => {
    const { id: rideId } = c.req.param();
    const { driverId, offerIndex } = c.req.valid('json');

    // ── 1. Acquire distributed lock FIRST ────────────────────────────────────
    // On 409: another ride already holds this driver; publish lock.denied and
    // bail out immediately — do NOT insert an offer or mark the driver busy.
    let lockResult;
    try {
      lockResult = await acquireDriverLock(driverId, rideId, OFFER_LOCK_TTL);
    } catch (err) {
      console.error(`[ride] lock acquire threw for driver ${driverId}:`, err);
      return c.json({ error: 'lock service unavailable' }, 503);
    }

    if (!lockResult.acquired) {
      publish({ type: 'lock.denied', rideId, driverId, heldBy: lockResult.heldBy });
      return c.json({ error: 'driver locked', heldBy: lockResult.heldBy }, 409);
    }

    // ── 2. Lock acquired — proceed with offer creation ────────────────────────
    const offerId = randomUUID();
    const now = new Date();

    // A new offer means the previous pending offer timed out — expire & release.
    await expirePendingOffers(rideId, driverId);

    // Upsert: if offer already exists for this (rideId, driverId) pair, ignore.
    await db
      .insert(schema.rideOffers)
      .values({
        id: offerId,
        rideId,
        driverId,
        status: 'PENDING',
        offerIndex,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    // Soft-lock: mark driver busy so concurrent nearby searches exclude them.
    await setDriverStatus(driverId, 'busy');

    // Update ride to MATCHING if not already.
    await db
      .update(schema.rides)
      .set({ status: 'MATCHING', updatedAt: new Date() })
      .where(
        and(eq(schema.rides.id, rideId), eq(schema.rides.status, 'REQUESTED')),
      );

    // Publish in order: lock event first, then offer event.
    publish({ type: 'lock.acquired', rideId, driverId });
    publish({ type: 'offer.created', rideId, driverId, offerIndex });

    return c.json({ ok: true });
  },
);

// POST /internal/rides/:id/matched
internal.post(
  '/rides/:id/matched',
  zValidator('json', MatchedCallbackSchema),
  async (c) => {
    const { id: rideId } = c.req.param();
    const { driverId } = c.req.valid('json');

    // Extend the offer-window lock to 1 h so the driver stays exclusively
    // assigned for the duration of the ride (no "complete ride" in this lab).
    await extendDriverLock(driverId, rideId, MATCHED_LOCK_TTL);

    await db
      .update(schema.rides)
      .set({ status: 'MATCHED', driverId, updatedAt: new Date() })
      .where(eq(schema.rides.id, rideId));

    // Matched driver stays busy and is excluded from future nearby searches.
    await setDriverStatus(driverId, 'busy');

    publish({ type: 'ride.matched', rideId, driverId });
    return c.json({ ok: true });
  },
);

// POST /internal/rides/:id/no-drivers
internal.post(
  '/rides/:id/no-drivers',
  zValidator('json', NoDriversCallbackSchema),
  async (c) => {
    const { id: rideId } = c.req.param();
    await expirePendingOffers(rideId);
    await db
      .update(schema.rides)
      .set({ status: 'NO_DRIVERS', updatedAt: new Date() })
      .where(eq(schema.rides.id, rideId));

    publish({ type: 'ride.no_drivers', rideId });
    return c.json({ ok: true });
  },
);

rideApp.route('/internal', internal);

// GET /health
rideApp.get('/health', (c) => c.json({ ok: true }));

// ── Serializers ───────────────────────────────────────────────────────────────

function serializeRide(row: typeof schema.rides.$inferSelect) {
  return {
    id: row.id,
    riderId: row.riderId,
    pickup: {
      lat: parseFloat(row.pickupLat),
      lng: parseFloat(row.pickupLng),
      address: row.pickupAddress,
    },
    dropoff: {
      lat: parseFloat(row.dropoffLat),
      lng: parseFloat(row.dropoffLng),
      address: row.dropoffAddress,
    },
    status: row.status,
    fareEstimate: parseFloat(row.fareEstimate),
    driverId: row.driverId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeOffer(row: typeof schema.rideOffers.$inferSelect) {
  return {
    id: row.id,
    rideId: row.rideId,
    driverId: row.driverId,
    status: row.status,
    offerIndex: row.offerIndex,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ── Internal trigger helper ───────────────────────────────────────────────────

async function triggerMatching(
  rideId: string,
  pickup: { lat: number; lng: number; address?: string },
  dropoff: { lat: number; lng: number; address?: string },
): Promise<void> {
  try {
    await db
      .update(schema.rides)
      .set({ status: 'MATCHING', updatedAt: new Date() })
      .where(
        and(eq(schema.rides.id, rideId), eq(schema.rides.status, 'REQUESTED')),
      );
    publish({ type: 'ride.matching', rideId });

    const res = await fetch(`${MATCHING_URL}/matches`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rideId, pickup, dropoff, radiusKm: 5 }),
    });
    if (!res.ok) {
      // Revert to REQUESTED so reconciler can retry
      await db
        .update(schema.rides)
        .set({ status: 'REQUESTED', updatedAt: new Date() })
        .where(eq(schema.rides.id, rideId));
    }
  } catch {
    // Revert so reconciler can retry
    await db
      .update(schema.rides)
      .set({ status: 'REQUESTED', updatedAt: new Date() })
      .where(eq(schema.rides.id, rideId));
  }
}

// ── REQUESTED reconciler ──────────────────────────────────────────────────────
// Re-triggers any ride stuck in REQUESTED for >5s (handles matching service outage)

export function startReconciler(): void {
  setInterval(async () => {
    try {
      const stuckRides = await db.query.rides.findMany({
        where: and(
          eq(schema.rides.status, 'REQUESTED'),
          rawSql`${schema.rides.updatedAt} < NOW() - INTERVAL '5 seconds'`,
        ),
        limit: 10,
      });

      for (const ride of stuckRides) {
        console.log(`[reconciler] Re-triggering REQUESTED ride ${ride.id}`);
        void triggerMatching(
          ride.id,
          {
            lat: parseFloat(ride.pickupLat),
            lng: parseFloat(ride.pickupLng),
            address: ride.pickupAddress ?? undefined,
          },
          {
            lat: parseFloat(ride.dropoffLat),
            lng: parseFloat(ride.dropoffLng),
            address: ride.dropoffAddress ?? undefined,
          },
        );
      }
    } catch (err) {
      console.error('[reconciler] error:', err);
    }
  }, 5_000);
}
