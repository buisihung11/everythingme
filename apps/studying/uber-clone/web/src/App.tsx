import { useCallback, useEffect, useState } from 'react';
import { Badge, Button } from '@everythingme/ui';
import { RiderPanel } from './components/rider-panel';
import { WorkflowTimeline } from './components/workflow-timeline';
import { DriverCards } from './components/driver-cards';
import { EventLog } from './components/event-log';
import { LockStatusPanel } from './components/lock-status-panel';
import { useSse } from './hooks/use-sse';
import { useDrivers } from './hooks/use-drivers';
import { useLocks } from './hooks/use-locks';
import { useWorkflowHistory } from './hooks/use-workflow-history';

export default function App() {
  /**
   * rideIds: all rides currently being tracked (1 for single, 2 for a race).
   * focusedRideId: the one shown in the Workflow Timeline.
   */
  const [rideIds, setRideIds] = useState<string[]>([]);
  const [focusedRideId, setFocusedRideId] = useState<string | null>(null);

  const { events: sseEvents, connected: eventsConnected } = useSse();
  const {
    drivers,
    loading: driversLoading,
    error: driversError,
    refresh: refreshDrivers,
  } = useDrivers();
  const { locks, error: locksError } = useLocks(sseEvents);
  const {
    events: workflowEvents,
    loading: workflowLoading,
    error: workflowError,
  } = useWorkflowHistory(focusedRideId);

  // Refresh driver badges as soon as availability or lock state changes.
  useEffect(() => {
    const last = sseEvents.at(-1);
    if (!last) return;
    if (
      last.type === 'offer.created' ||
      last.type === 'offer.accepted' ||
      last.type === 'offer.declined' ||
      last.type === 'offer.timeout' ||
      last.type === 'ride.matched' ||
      last.type === 'ride.no_drivers' ||
      last.type === 'lock.acquired' ||
      last.type === 'lock.released'
    ) {
      void refreshDrivers();
    }
  }, [sseEvents, refreshDrivers]);

  /** Called by RiderPanel for both single and race flows. */
  const handleRidesCreated = useCallback((ids: string[]) => {
    setRideIds(ids);
    // Auto-focus the first ride for the workflow timeline.
    setFocusedRideId(ids[0] ?? null);
  }, []);

  const handleClear = useCallback(() => {
    setRideIds([]);
    setFocusedRideId(null);
  }, []);

  const isRace = rideIds.length > 1;

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Distributed systems lab
              </p>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ride matching simulator
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Follow a ride request through AWS Step Functions, then control how
              each nearby driver responds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* SSE connection indicator */}
            <Badge variant="outline" className="gap-2 bg-background py-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  eventsConnected ? 'bg-green-600' : 'bg-amber-500'
                }`}
                aria-hidden
              />
              {eventsConnected ? 'Event stream connected' : 'Event stream reconnecting'}
            </Badge>

            {/* Race ride badges — show both when racing, single badge otherwise */}
            {isRace ? (
              <>
                <Badge
                  variant="outline"
                  className="gap-1.5 bg-amber-50 py-1.5 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700"
                >
                  ⚡ Race
                </Badge>
                {rideIds.map((id, idx) => (
                  <Button
                    key={id}
                    variant={focusedRideId === id ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-7 font-mono text-xs"
                    onClick={() => setFocusedRideId(id)}
                    title={`Click to inspect ride ${id} in the workflow timeline`}
                  >
                    Ride {String.fromCharCode(65 + idx)}: {id.slice(0, 8)}
                  </Button>
                ))}
              </>
            ) : (
              focusedRideId && (
                <Badge variant="secondary" className="py-1.5 font-mono">
                  Ride {focusedRideId.slice(0, 8)}
                </Badge>
              )
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[300px_minmax(560px,1fr)_340px]">
        {/* Left sidebar: configure ride */}
        <aside className="min-w-0">
          <RiderPanel onRidesCreated={handleRidesCreated} />
        </aside>

        {/* Centre: workflow execution (focuses on the selected race ride) */}
        <section className="min-w-0 lg:row-span-2 xl:row-span-1" aria-label="Workflow execution">
          <WorkflowTimeline
            events={workflowEvents}
            rideId={focusedRideId}
            onClear={handleClear}
            loading={workflowLoading}
            error={workflowError}
          />
        </section>

        {/* Right sidebar: drivers + lock status */}
        <aside className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-2 xl:col-start-3 xl:row-start-1">
          <DriverCards
            drivers={drivers}
            sseEvents={sseEvents}
            activeRideIds={rideIds}
            locks={locks}
            loading={driversLoading}
            error={driversError}
          />
          <LockStatusPanel
            drivers={drivers}
            locks={locks}
            sseEvents={sseEvents}
            error={locksError}
          />
        </aside>

        {/* Full-width bottom: domain event log */}
        <section className="min-w-0 lg:col-span-2 xl:col-span-3" aria-label="Domain event history">
          <EventLog events={sseEvents} />
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Local learning environment</p>
          <p className="font-mono">SFN 8083 · Redis 6380 · Postgres 5433 · APIs 4401–4403</p>
        </div>
      </footer>
    </div>
  );
}
