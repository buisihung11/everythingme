export interface TransportOptions {
  signal?: AbortSignal;
}

export interface Transport {
  get<T>(path: string, options?: TransportOptions): Promise<T>;
}

/** Realistic fetch transport for when a real API is available. */
export const fetchTransport: Transport = {
  async get<T>(path: string, options?: TransportOptions): Promise<T> {
    const response = await fetch(path, { signal: options?.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  },
};

export interface MockTransportOptions {
  /** Simulated latency in ms. Default: 300. */
  latencyMs?: number;
  /**
   * Fraction of calls that should fail (0–1). Default: 0.
   * When > 0, each call independently rolls the dice.
   */
  flakiness?: number;
  /** When true, the mock never resolves (simulates timeout). */
  hang?: boolean;
}

/**
 * Deterministic mock transport with configurable latency, flakiness, and
 * hang mode. Used to demo retry and timeout behaviour offline.
 */
export function createMockTransport(
  data: Record<string, unknown>,
  opts: MockTransportOptions = {},
): Transport & { setFlakiness(f: number): void; setHang(h: boolean): void } {
  const state = {
    latencyMs: opts.latencyMs ?? 300,
    flakiness: opts.flakiness ?? 0,
    hang: opts.hang ?? false,
    callCount: 0,
  };

  return {
    setFlakiness(f: number) {
      state.flakiness = f;
    },
    setHang(h: boolean) {
      state.hang = h;
    },
    async get<T>(path: string, options?: TransportOptions): Promise<T> {
      state.callCount++;
      const attempt = state.callCount;

      await new Promise<void>((resolve, reject) => {
        if (state.hang) {
          // Never resolve — timeout middleware will fire
          options?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
          return;
        }

        const timer = setTimeout(() => {
          if (state.flakiness > 0 && Math.random() < state.flakiness) {
            reject(new Error(`Mock transport flaky failure (attempt ${attempt})`));
          } else {
            resolve();
          }
        }, state.latencyMs);

        options?.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });

      const result = data[path];
      if (result === undefined) {
        throw new Error(`Mock transport: no fixture for path "${path}"`);
      }
      return result as T;
    },
  };
}

/** Shared mock instance used by the dashboard and pipeline demo. */
export const mockTransport = createMockTransport(
  {
    '/stats': {
      totalUsers: 1284,
      totalProducts: 342,
      revenue: 89420,
      activeSessions: 87,
    },
  },
  { latencyMs: 400, flakiness: 0 },
);
