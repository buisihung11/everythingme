/**
 * lock-status-panel.tsx
 * Shows the current Redis SET NX lock state for each driver.
 *
 * Data sources:
 *  - `locks`  — snapshot from GET /locks (refreshed every 2s + on SSE)
 *  - `drivers` — names plus optional lockRideId from Location Service
 *  - `sseEvents` — live lock.acquired / lock.released overlay and deny highlights
 */

import { useEffect, useState } from 'react';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  cn,
} from '@everythingme/ui';
import type { DriverInfo } from '../hooks/use-drivers';
import type { AnyEvent, LockInfo, LockDeniedEvent } from '../lib/lock-types';
import { resolveDriverLocks } from '../lib/lock-types';
import { StepTitle } from './step-title';

interface RecentDeny {
  /** The ride that was denied the lock. */
  rideId: string;
  /** The ride ID that is currently holding the lock. */
  heldBy: string;
  /** Epoch ms when this deny was recorded (used to de-duplicate clears). */
  at: number;
}

interface Props {
  drivers: DriverInfo[];
  locks: LockInfo[];
  sseEvents: AnyEvent[];
  error?: boolean;
}

export function LockStatusPanel({ drivers, locks, sseEvents, error }: Props) {
  /** Per-driver recent deny info, cleared after 8 seconds. */
  const [recentDenies, setRecentDenies] = useState<Record<string, RecentDeny>>({});

  useEffect(() => {
    const last = sseEvents.at(-1);
    if (!last || last.type !== 'lock.denied') return;

    const denied = last as LockDeniedEvent;
    const at = Date.now();

    setRecentDenies((prev) => ({
      ...prev,
      [denied.driverId]: { rideId: denied.rideId, heldBy: denied.heldBy, at },
    }));

    // Fade out the deny highlight after 8 seconds
    const timerId = setTimeout(() => {
      setRecentDenies((prev) => {
        const entry = prev[denied.driverId];
        // Only remove if it's still the same event we recorded
        if (!entry || entry.at !== at) return prev;
        const next = { ...prev };
        delete next[denied.driverId];
        return next;
      });
    }, 8000);

    return () => clearTimeout(timerId);
  }, [sseEvents]);

  const lockByDriver = resolveDriverLocks(locks, drivers, sseEvents);
  const activeCount = Object.keys(lockByDriver).length;

  return (
    <Card className="min-w-0 gap-5 shadow-none">
      <CardHeader className="px-5">
        <StepTitle step={3}>Lock status</StepTitle>
        <CardDescription>
          {error
            ? 'GET /locks is unavailable. Restart the Location Service (pnpm dev) so lock APIs load.'
            : activeCount === 0
              ? 'No active Redis locks. Race 2 rides to see them compete.'
              : `${activeCount} active lock${activeCount !== 1 ? 's' : ''}. Held = ride that claimed this driver.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-5">
        {drivers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No drivers registered.</p>
        ) : (
          drivers.map((d) => {
            const lock = lockByDriver[d.id];
            const deny = recentDenies[d.id];

            return (
              <div
                key={d.id}
                className={cn(
                  'flex items-start justify-between gap-2 rounded-md border px-3 py-2.5 text-xs transition-colors duration-300',
                  deny
                    ? 'border-destructive/40 bg-destructive/5'
                    : lock
                      ? 'border-amber-300/60 bg-amber-50/40 dark:border-amber-700/40 dark:bg-amber-950/20'
                      : 'bg-muted/20',
                )}
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-medium">{d.name}</p>
                  {deny && (
                    <p className="truncate text-destructive">
                      ✗ ride {deny.rideId.slice(0, 8)} denied — held by {deny.heldBy.slice(0, 8)}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {lock ? (
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] font-normal text-amber-700 border-amber-400"
                    >
                      {lock.rideId.slice(0, 8)}
                      {lock.ttlSeconds != null ? ` · ${lock.ttlSeconds}s` : ''}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal text-muted-foreground"
                    >
                      free
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
