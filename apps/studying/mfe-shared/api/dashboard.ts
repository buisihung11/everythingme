import { z } from 'zod';
import { retry, timeout } from '@everythingme/api';
import { api } from './client';
import { mockTransport } from './transport';
import type { DashboardStats } from '../types';

const fetchDashboardStatsSchema = z.object({
  /**
   * When true, the mock transport is configured to fail on every call
   * so the retry middleware is exercised.
   */
  simulateFlakiness: z.boolean().optional(),
}).default({});

export const fetchDashboardStats = api
  .metadata({ feature: 'dashboard', action: 'fetch-stats' })
  .input(fetchDashboardStatsSchema)
  .use(retry({ attempts: 3, delayMs: 200 }))
  .use(timeout({ ms: 2000 }))
  .handler(async ({ input, ctx }) => {
    if (input.simulateFlakiness) {
      mockTransport.setFlakiness(0.8);
    } else {
      mockTransport.setFlakiness(0);
    }
    return mockTransport.get<DashboardStats>('/stats', { signal: ctx.signal });
  });
