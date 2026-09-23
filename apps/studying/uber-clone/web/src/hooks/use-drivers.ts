/**
 * use-drivers.ts
 * Fetches the list of drivers from the Location Service and polls every 3s.
 */

import { useCallback, useEffect, useState } from 'react';
import { LOCATION_URL, fetchJson } from '../lib/api';

const POLL_INTERVAL_MS = 3000;

export interface DriverInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  /** Ride ID currently holding this driver's distributed lock (if any). */
  lockRideId?: string;
}

export function useDrivers() {
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchJson<{ drivers: DriverInfo[] }>(
        `${LOCATION_URL}/drivers`,
      );
      setDrivers(data.drivers);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { drivers, loading, error, refresh };
}
