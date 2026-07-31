import { z } from 'zod';
import { retry, timeout } from '@everythingme/api';
import { api } from './client';
import { setAxiosMockFlakiness } from './axios-client';
import { axiosTransport } from './transport';
import type { DashboardStats } from '../types';

const fetchDashboardStatsSchema = z.object({
  /**
   * When true, the mock transport is configured to fail on every call
   * so the retry middleware is exercised.
   */
  simulateFlakiness: z.boolean().optional(),
}).default({});

const dashboardStatsSchema = z.object({
  totalUsers: z.number(),
  totalProducts: z.number(),
  revenue: z.number(),
  activeSessions: z.number(),
});

export const fetchDashboardStats = api
  .metadata({ feature: 'dashboard', action: 'fetch-stats' })
  .input(fetchDashboardStatsSchema)
  .output(dashboardStatsSchema)
  .use(retry({ attempts: 3, delayMs: 200 }))
  .use(timeout({ ms: 2000 }))
  .handler(async ({ input, ctx }) => {
    setAxiosMockFlakiness(input.simulateFlakiness ? 0.8 : 0);
    return axiosTransport.get<DashboardStats>('/stats', { signal: ctx.signal });
  });
