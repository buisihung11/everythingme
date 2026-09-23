/**
 * use-sse.ts
 * Subscribes to the Ride Service SSE /events stream and returns every event
 * received so far plus the connection state.
 *
 * The stream may carry both shared DomainEvents (ride/offer lifecycle) and
 * lock events (lock.acquired / lock.denied / lock.released). Events are typed
 * as AnyEvent to represent the full union.
 */

import { useEffect, useState } from 'react';
import type { AnyEvent } from '../lib/lock-types';
import { RIDE_URL } from '../lib/api';

export function useSse() {
  const [events, setEvents] = useState<AnyEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource(`${RIDE_URL}/events`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data as string) as Record<string, unknown>;
        // The server sends a `connected` handshake that is not a domain event.
        if (parsed.type === 'connected') return;
        setEvents((prev) => [...prev, parsed as AnyEvent]);
      } catch {
        // ignore malformed events
      }
    };

    return () => source.close();
  }, []);

  return { events, connected };
}
