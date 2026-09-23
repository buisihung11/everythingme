/**
 * SSE event bus for broadcasting domain events to connected web clients.
 *
 * Lock events (lock.acquired / lock.denied / lock.released) are part of the
 * shared DomainEvent union in @studying/uber-clone/shared.
 */

import type { DomainEvent } from '@studying/uber-clone/shared';

type Subscriber = (event: DomainEvent) => void;

const subscribers = new Set<Subscriber>();

export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function publish(event: DomainEvent): void {
  for (const fn of subscribers) {
    try {
      fn(event);
    } catch {
      // ignore errors from individual subscribers
    }
  }
}
