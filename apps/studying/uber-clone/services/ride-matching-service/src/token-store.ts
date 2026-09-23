/**
 * token-store.ts
 * Redis-backed store for Step Functions activity task tokens.
 * Key: offer:{rideId}:{driverId}  TTL: 60s (just above the 10s offer timeout)
 */

import { Redis } from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6380', 10),
});

const TTL_SECONDS = 60;

function tokenKey(rideId: string, driverId: string): string {
  return `offer:${rideId}:${driverId}`;
}

export async function saveToken(
  rideId: string,
  driverId: string,
  token: string,
): Promise<void> {
  await redis.set(tokenKey(rideId, driverId), token, 'EX', TTL_SECONDS);
}

export async function getToken(
  rideId: string,
  driverId: string,
): Promise<string | null> {
  return redis.get(tokenKey(rideId, driverId));
}

export async function deleteToken(
  rideId: string,
  driverId: string,
): Promise<void> {
  await redis.del(tokenKey(rideId, driverId));
}

export { redis };
