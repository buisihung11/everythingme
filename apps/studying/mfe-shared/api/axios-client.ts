import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

const MOCK_LATENCY_MS = 400;

const fixtures: Record<string, unknown> = {
  '/stats': {
    totalUsers: 1284,
    totalProducts: 342,
    revenue: 89420,
    activeSessions: 87,
  },
};

let mockFlakiness = 0;

/** Toggle flaky failures for dashboard retry demos (0–1). */
export function setAxiosMockFlakiness(flakiness: number) {
  mockFlakiness = flakiness;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

async function mockAdapter(config: AxiosRequestConfig): Promise<AxiosResponse> {
  const path = config.url ?? '';
  const fixture = fixtures[path];
  if (fixture === undefined) {
    throw new Error(`No axios mock fixture for "${path}"`);
  }

  await sleep(MOCK_LATENCY_MS, config.signal ?? undefined);

  if (mockFlakiness > 0 && Math.random() < mockFlakiness) {
    throw new Error('Mock axios flaky failure');
  }

  return {
    data: fixture,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config as AxiosResponse['config'],
  };
}

/**
 * Shared axios instance for MFE API calls.
 * Handlers pass `ctx.signal` from the timeout middleware for cancellation.
 *
 * In development, known paths are served from in-memory fixtures via a custom
 * adapter so the demo works offline. Point `baseURL` at a real API in production.
 */
export const axiosClient = axios.create({
  baseURL: '/api',
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const path = config.url ?? '';
  if (fixtures[path] !== undefined) {
    config.adapter = mockAdapter;
  }
  return config;
});
