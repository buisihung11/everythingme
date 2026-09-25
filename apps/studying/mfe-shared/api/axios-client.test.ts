import { afterEach, describe, expect, it, vi } from 'vitest';
import { axiosClient, setAxiosMockFlakiness } from './axios-client';

describe('axiosClient mock adapter', () => {
  afterEach(() => {
    setAxiosMockFlakiness(0);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns the in-memory /stats fixture after mock latency', async () => {
    vi.useFakeTimers();

    const promise = axiosClient.get('/stats');
    await vi.advanceTimersByTimeAsync(400);

    const { data } = await promise;
    expect(data).toEqual({
      totalUsers: 1284,
      totalProducts: 342,
      revenue: 89420,
      activeSessions: 87,
    });
  });

  it('does not use the mock adapter for paths without fixtures', async () => {
    const promise = axiosClient.get('/unknown').catch((error) => error);
    const error = await promise;
    expect((error as Error).message).toBe('Network Error');
  });

  it('aborts in-flight mock latency when the request signal is cancelled', async () => {
    vi.useFakeTimers();

    const controller = new AbortController();
    const promise = axiosClient.get('/stats', { signal: controller.signal });

    await vi.advanceTimersByTimeAsync(100);
    controller.abort();

    let caught: unknown;
    try {
      await promise;
    } catch (error) {
      caught = error;
    }

    expect((caught as Error).message).toMatch(/canceled/i);
  });
});
