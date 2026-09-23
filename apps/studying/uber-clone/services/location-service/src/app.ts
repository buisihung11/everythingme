import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Redis } from 'ioredis';
import { DriverStatusSchema } from '@studying/uber-clone/shared';

// ── Redis Client ──────────────────────────────────────────────────────────────

const redis = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6380', 10),
});

const GEO_KEY = 'drivers:geo';
const DRIVER_HASH_PREFIX = 'driver:';
/** Must not start with `driver:` — GET /drivers uses KEYS driver:* and HGETALL. */
const LOCK_KEY_PREFIX = 'ride-lock:';
const DEFAULT_LOCK_TTL = 30; // seconds

// Lua: delete only if value matches; returns 1=deleted, 0=key-gone (idempotent), -1=wrong-owner
const RELEASE_SCRIPT = `
local val = redis.call('GET', KEYS[1])
if val == false then return 0 end
if val == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return -1
`;

// Lua: EXPIRE only if value matches; returns 1=extended, -1=wrong-owner/missing
const EXTEND_SCRIPT = `
local val = redis.call('GET', KEYS[1])
if val == ARGV[1] then return redis.call('EXPIRE', KEYS[1], ARGV[2]) end
return -1
`;

// ── Chaos state ───────────────────────────────────────────────────────────────
let chaosRemainingFailures = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getDriverMeta(driverId: string) {
  const data = await redis.hgetall(`${DRIVER_HASH_PREFIX}${driverId}`);
  if (!data || !data.id) return null;
  return {
    id: data.id,
    name: data.name ?? driverId,
    status: (data.status ?? 'available') as z.infer<typeof DriverStatusSchema>,
    lat: parseFloat(data.lat ?? '0'),
    lng: parseFloat(data.lng ?? '0'),
  };
}

async function getDriverLockRideId(driverId: string): Promise<string | null> {
  return redis.get(`${LOCK_KEY_PREFIX}${driverId}`);
}

// ── App ───────────────────────────────────────────────────────────────────────

export const locationApp = new Hono();
locationApp.use('*', cors());

// PUT /drivers/:id/location
locationApp.put(
  '/drivers/:id/location',
  zValidator(
    'json',
    z.object({
      lat: z.number(),
      lng: z.number(),
      status: DriverStatusSchema.optional(),
      name: z.string().optional(),
    }),
  ),
  async (c) => {
    const { id } = c.req.param();
    const { lat, lng, status = 'available', name } = c.req.valid('json');

    // GEOADD stores as (lng, lat) internally
    await redis.geoadd(GEO_KEY, lng, lat, id);
    await redis.hset(`${DRIVER_HASH_PREFIX}${id}`, {
      id,
      lat: lat.toString(),
      lng: lng.toString(),
      status,
      ...(name ? { name } : {}),
    });

    return c.json({ ok: true });
  },
);

// PATCH /drivers/:id/status
locationApp.patch(
  '/drivers/:id/status',
  zValidator('json', z.object({ status: DriverStatusSchema })),
  async (c) => {
    const { id } = c.req.param();
    const { status } = c.req.valid('json');
    await redis.hset(`${DRIVER_HASH_PREFIX}${id}`, { status });
    return c.json({ ok: true });
  },
);

// GET /drivers/nearby?lat&lng&radiusKm&limit
locationApp.get('/drivers/nearby', async (c) => {
  // Chaos: fail the next N requests
  if (chaosRemainingFailures > 0) {
    chaosRemainingFailures--;
    return c.json({ error: 'chaos_induced_failure' }, 503);
  }

  const lat = parseFloat(c.req.query('lat') ?? '0');
  const lng = parseFloat(c.req.query('lng') ?? '0');
  const radiusKm = parseFloat(c.req.query('radiusKm') ?? '5');
  const limit = parseInt(c.req.query('limit') ?? '10', 10);

  // GEOSEARCH FROMLONLAT BYRADIUS ... WITHDIST ASC
  // ioredis returns array of [member, distance] pairs when WITHDIST+ASC
  const raw = (await redis.call(
    'GEOSEARCH',
    GEO_KEY,
    'FROMLONLAT',
    lng.toString(),
    lat.toString(),
    'BYRADIUS',
    radiusKm.toString(),
    'km',
    'ASC',
    'COUNT',
    limit.toString(),
    'WITHDIST',
  )) as Array<[string, string]>;

  const drivers = [];
  for (const [driverId, distStr] of raw) {
    const meta = await getDriverMeta(driverId);
    if (!meta || meta.status !== 'available') continue;
    const lockRideId = await getDriverLockRideId(driverId);
    if (lockRideId) continue; // skip drivers claimed by another ride
    drivers.push({
      ...meta,
      distanceKm: parseFloat(distStr),
    });
  }

  return c.json({ drivers });
});

// GET /drivers – list all known drivers
locationApp.get('/drivers', async (c) => {
  const keys = await redis.keys(`${DRIVER_HASH_PREFIX}*`);
  const drivers = [];
  for (const key of keys) {
    // Lock keys used to share this prefix; skip any non-hash key.
    const type = await redis.type(key);
    if (type !== 'hash') continue;

    const data = await redis.hgetall(key);
    if (data?.id) {
      const lockRideId = await getDriverLockRideId(data.id);
      drivers.push({
        id: data.id,
        name: data.name ?? data.id,
        lat: parseFloat(data.lat ?? '0'),
        lng: parseFloat(data.lng ?? '0'),
        status: data.status ?? 'available',
        ...(lockRideId ? { lockRideId } : {}),
      });
    }
  }
  return c.json({ drivers });
});

// ── Lock API ──────────────────────────────────────────────────────────────────

// POST /drivers/:id/lock  { rideId, ttlSeconds? }
// Acquire lock via SET NX EX. 201 on success, 409 { heldBy } if already locked.
locationApp.post(
  '/drivers/:id/lock',
  zValidator(
    'json',
    z.object({
      rideId: z.string().min(1),
      ttlSeconds: z.number().int().positive().optional(),
    }),
  ),
  async (c) => {
    const { id: driverId } = c.req.param();
    const { rideId, ttlSeconds = DEFAULT_LOCK_TTL } = c.req.valid('json');
    const lockKey = `${LOCK_KEY_PREFIX}${driverId}`;

    const result = await redis.set(lockKey, rideId, 'EX', ttlSeconds, 'NX');
    if (result === 'OK') {
      return c.json({ ok: true, driverId, rideId }, 201);
    }
    const heldBy = await redis.get(lockKey);
    return c.json({ heldBy }, 409);
  },
);

// DELETE /drivers/:id/lock  { rideId }
// Compare-and-delete via Lua. 200 (idempotent) unless held by a different ride (409).
locationApp.delete(
  '/drivers/:id/lock',
  zValidator('json', z.object({ rideId: z.string().min(1) })),
  async (c) => {
    const { id: driverId } = c.req.param();
    const { rideId } = c.req.valid('json');
    const lockKey = `${LOCK_KEY_PREFIX}${driverId}`;

    const result = (await redis.eval(RELEASE_SCRIPT, 1, lockKey, rideId)) as number;
    if (result === -1) {
      // Key exists but owned by a different ride
      const heldBy = await redis.get(lockKey);
      return c.json({ heldBy }, 409);
    }
    // result === 1 (deleted) or 0 (already gone) → idempotent success
    return c.json({ ok: true }, 200);
  },
);

// POST /drivers/:id/lock/extend  { rideId, ttlSeconds }
// Extend TTL only when current value == rideId. 200 or 409.
locationApp.post(
  '/drivers/:id/lock/extend',
  zValidator(
    'json',
    z.object({
      rideId: z.string().min(1),
      ttlSeconds: z.number().int().positive(),
    }),
  ),
  async (c) => {
    const { id: driverId } = c.req.param();
    const { rideId, ttlSeconds } = c.req.valid('json');
    const lockKey = `${LOCK_KEY_PREFIX}${driverId}`;

    const result = (await redis.eval(
      EXTEND_SCRIPT,
      1,
      lockKey,
      rideId,
      ttlSeconds.toString(),
    )) as number;
    if (result === -1) {
      const heldBy = await redis.get(lockKey);
      return c.json({ heldBy: heldBy ?? null }, 409);
    }
    return c.json({ ok: true }, 200);
  },
);

// GET /locks – list all active driver locks for the dashboard
locationApp.get('/locks', async (c) => {
  const lockKeys = await redis.keys(`${LOCK_KEY_PREFIX}*`);
  const locks: Array<{ driverId: string; rideId: string; ttlSeconds: number | null }> = [];

  for (const key of lockKeys) {
    const rideId = await redis.get(key);
    if (!rideId) continue; // expired between KEYS and GET
    const ttl = await redis.ttl(key);
    const driverId = key.slice(LOCK_KEY_PREFIX.length);
    locks.push({ driverId, rideId, ttlSeconds: ttl >= 0 ? ttl : null });
  }

  return c.json({ locks });
});

// POST /chaos – make the next N nearby requests fail
locationApp.post(
  '/chaos',
  zValidator('json', z.object({ failures: z.number().int().min(0).max(100) })),
  (c) => {
    const { failures } = c.req.valid('json');
    chaosRemainingFailures = failures;
    return c.json({ ok: true, chaosRemainingFailures });
  },
);

// GET /health
locationApp.get('/health', (c) => c.json({ ok: true }));
