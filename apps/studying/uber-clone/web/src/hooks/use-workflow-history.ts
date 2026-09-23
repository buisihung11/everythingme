/**
 * use-workflow-history.ts
 * Polls the Matching Service for execution history every 1s when a rideId is active.
 */

import { useEffect, useState } from 'react';
import { MATCHING_URL, fetchJson } from '../lib/api';

const POLL_INTERVAL_MS = 1000;

export interface HistoryEvent {
  id: number;
  type: string;
  timestamp: string;
  stateEnteredEventDetails?: { name: string };
  stateExitedEventDetails?: { name: string };
  executionFailedEventDetails?: { error: string; cause: string };
  taskScheduledEventDetails?: { resource: string };
  activityFailedEventDetails?: { error: string; cause: string };
}

export function useWorkflowHistory(rideId: string | null) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!rideId) {
      setEvents([]);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    const poll = async () => {
      try {
        const data = await fetchJson<{ events?: HistoryEvent[] }>(
          `${MATCHING_URL}/matches/${rideId}/history`,
        );
        setEvents(data.events ?? []);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [rideId]);

  return { events, loading, error };
}
