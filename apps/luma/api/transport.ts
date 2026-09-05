import type { EventDto } from './schemas';

export interface TransportOptions {
  signal?: AbortSignal;
}

export interface Transport {
  get<T>(path: string, options?: TransportOptions): Promise<T>;
  post<T>(path: string, body: unknown, options?: TransportOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: TransportOptions): Promise<T>;
}

export interface MockTransportOptions {
  latencyMs?: number;
}

/**
 * In-memory transport backed by a mutable event store.
 * Simulates network latency so loading states are visible in the UI.
 */
export function createMockTransport(
  initialEvents: EventDto[],
  opts: MockTransportOptions = {},
): Transport {
  const state = { events: [...initialEvents] };
  const latencyMs = opts.latencyMs ?? 250;

  async function delay(signal?: AbortSignal) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, latencyMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }

  return {
    async get<T>(path: string, options?: TransportOptions) {
      await delay(options?.signal);

      if (path === '/events') {
        return [...state.events] as T;
      }

      const match = path.match(/^\/events\/([^/]+)$/);
      if (match) {
        const event = state.events.find((e) => e.id === match[1]);
        if (!event) throw new Error(`Event not found: ${match[1]}`);
        return event as T;
      }

      throw new Error(`Mock transport: no fixture for path "${path}"`);
    },

    async post<T>(path: string, body: unknown, options?: TransportOptions) {
      await delay(options?.signal);

      if (path === '/events') {
        const input = body as Omit<EventDto, 'id' | 'going' | 'attendeeCount'>;
        const event: EventDto = {
          ...input,
          id: String(Date.now()),
          going: false,
          attendeeCount: 0,
        };
        state.events = [event, ...state.events];
        return event as T;
      }

      throw new Error(`Mock transport: no fixture for path "${path}"`);
    },

    async patch<T>(path: string, _body?: unknown, options?: TransportOptions) {
      await delay(options?.signal);

      const match = path.match(/^\/events\/([^/]+)\/rsvp$/);
      if (match) {
        const id = match[1];
        const index = state.events.findIndex((e) => e.id === id);
        if (index === -1) throw new Error(`Event not found: ${id}`);

        const current = state.events[index];
        const going = !current.going;
        const updated: EventDto = {
          ...current,
          going,
          attendeeCount: going
            ? current.attendeeCount + 1
            : Math.max(0, current.attendeeCount - 1),
        };
        state.events = [
          ...state.events.slice(0, index),
          updated,
          ...state.events.slice(index + 1),
        ];
        return updated as T;
      }

      throw new Error(`Mock transport: no fixture for path "${path}"`);
    },
  };
}
