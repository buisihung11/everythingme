import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchDashboardStats } from './dashboard';
import { setAxiosMockFlakiness } from './axios-client';
import { axiosTransport } from './transport';

vi.mock('./axios-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./axios-client')>();
  return {
    ...actual,
    setAxiosMockFlakiness: vi.fn(actual.setAxiosMockFlakiness),
  };
});

vi.mock('./transport', () => ({
  axiosTransport: {
    get: vi.fn().mockResolvedValue({
      totalUsers: 1284,
      totalProducts: 342,
      revenue: 89420,
      activeSessions: 87,
    }),
  },
}));

describe('fetchDashboardStats', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns validated dashboard stats and passes the abort signal', async () => {
    const stats = await fetchDashboardStats({});

    expect(stats).toEqual({
      totalUsers: 1284,
      totalProducts: 342,
      revenue: 89420,
      activeSessions: 87,
    });
    expect(axiosTransport.get).toHaveBeenCalledWith('/stats', {
      signal: expect.any(AbortSignal),
    });
  });

  it('enables mock flakiness when simulateFlakiness is true', async () => {
    await fetchDashboardStats({ simulateFlakiness: true });

    expect(setAxiosMockFlakiness).toHaveBeenCalledWith(0.8);
  });

  it('disables mock flakiness by default', async () => {
    await fetchDashboardStats({});

    expect(setAxiosMockFlakiness).toHaveBeenCalledWith(0);
  });

  it('rejects invalid output from the transport', async () => {
    vi.mocked(axiosTransport.get).mockResolvedValueOnce({
      totalUsers: 'not-a-number',
      totalProducts: 1,
      revenue: 1,
      activeSessions: 1,
    });

    await expect(fetchDashboardStats({})).rejects.toThrow(/Output validation failed/);
  });
});
