/// <reference types="vite/client" />
/**
 * api.ts
 * Base URLs of the local services plus the small fetch helpers the UI needs.
 */

export const RIDE_URL = import.meta.env.VITE_RIDE_URL ?? 'http://localhost:4401';
export const MATCHING_URL =
  import.meta.env.VITE_MATCHING_URL ?? 'http://localhost:4402';
export const LOCATION_URL =
  import.meta.env.VITE_LOCATION_URL ?? 'http://localhost:4403';

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${url} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function postJson<T = unknown>(url: string, body: unknown): Promise<T> {
  return fetchJson<T>(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Lock Service helpers ────────────────────────────────────────────────────

export interface LockEntry {
  driverId: string;
  rideId: string;
  ttlSeconds: number | null;
}

/** Fetch the current lock snapshot from the Location Service. */
export async function fetchLocks(): Promise<LockEntry[]> {
  const data = await fetchJson<{ locks: LockEntry[] }>(`${LOCATION_URL}/locks`);
  return data.locks;
}
