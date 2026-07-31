import { eventPayloadSchemas, type EventPayloadMap, type MfeEventType } from './event-schemas';

export type { MfeEventType } from './event-schemas';

export interface MfeEvent<T extends MfeEventType = MfeEventType> {
  type: T;
  payload: EventPayloadMap[T];
  source: string;
  timestamp: number;
}

export type MfeEventHandler<T extends MfeEventType = MfeEventType> = (event: MfeEvent<T>) => void;

export interface MfeEventBus {
  /** Payload is validated against the zod schema for `type`; invalid payloads are logged and dropped. */
  publish<T extends MfeEventType>(type: T, payload: EventPayloadMap[T], source: string): void;
  subscribe<T extends MfeEventType>(type: T, handler: MfeEventHandler<T>): () => void;
  getHistory(): MfeEvent[];
  clearHistory(): void;
}

declare global {
  interface Window {
    __MFE_EVENT_BUS__?: MfeEventBus;
  }
}

const MAX_HISTORY = 200;

function createEventBus(): MfeEventBus {
  const listeners = new Map<MfeEventType, Set<MfeEventHandler<never>>>();
  const history: MfeEvent[] = [];

  return {
    publish<T extends MfeEventType>(type: T, payload: EventPayloadMap[T], source: string) {
      const result = eventPayloadSchemas[type].safeParse(payload);
      if (!result.success) {
        console.error(
          `[mfe-event-bus] rejected invalid "${type}" payload from "${source}"`,
          result.error.flatten(),
        );
        return;
      }

      const event: MfeEvent<T> = {
        type,
        payload: result.data as EventPayloadMap[T],
        source,
        timestamp: Date.now(),
      };
      history.push(event);
      if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
      }
      listeners.get(type)?.forEach((handler) => {
        try {
          handler(event as MfeEvent<never>);
        } catch (error) {
          console.error(`[mfe-event-bus] subscriber for "${type}" threw`, error);
        }
      });
    },
    subscribe<T extends MfeEventType>(type: T, handler: MfeEventHandler<T>) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type)!.add(handler as MfeEventHandler<never>);
      return () => listeners.get(type)?.delete(handler as MfeEventHandler<never>);
    },
    getHistory() {
      return [...history];
    },
    clearHistory() {
      history.length = 0;
    },
  };
}

export function getEventBus(): MfeEventBus {
  if (window.__MFE_EVENT_BUS__) {
    return window.__MFE_EVENT_BUS__;
  }
  // Freeze the bus API and lock the window property so no remote — buggy or
  // malicious — can reassign the singleton or monkey-patch publish/subscribe.
  const bus = Object.freeze(createEventBus());
  Object.defineProperty(window, '__MFE_EVENT_BUS__', {
    value: bus,
    writable: false,
    configurable: false,
    enumerable: true,
  });
  return bus;
}
