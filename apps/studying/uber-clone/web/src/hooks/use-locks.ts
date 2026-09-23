/**
 * use-locks.ts
 * Polls GET /locks from the Location Service and eagerly refreshes
 * whenever a lock SSE event arrives.
 */

import { useCallback, useEffect, useState } from 'react';
import type { AnyEvent, LockInfo } from '../lib/lock-types';
import { fetchLocks } from '../lib/api';

const POLL_INTERVAL_MS = 2000;

export function useLocks(sseEvents: AnyEvent[]) {
  const [locks, setLocks] = useState<LockInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchLocks();
      setLocks(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const last = sseEvents.at(-1);
    if (!last) return;
    if (
      last.type === 'lock.acquired' ||
      last.type === 'lock.denied' ||
      last.type === 'lock.released'
    ) {
      void refresh();
    }
  }, [sseEvents, refresh]);

  return { locks, loading, error, refresh };
}
