import { useCallback, useEffect, useState } from 'react';
import { Badge, Button } from '@everythingme/ui';
import { BookingMap } from './components/booking-map';
import { RiderPanel } from './components/rider-panel';
import { WorkflowTimeline } from './components/workflow-timeline';
import { DriverCards } from './components/driver-cards';
import { EventLog } from './components/event-log';
import { LockStatusPanel } from './components/lock-status-panel';
import { LabInspector, type LabInspectorTab } from './components/lab-inspector';
import { useSse } from './hooks/use-sse';
import { useDrivers } from './hooks/use-drivers';
import { useLocks } from './hooks/use-locks';
import { useWorkflowHistory } from './hooks/use-workflow-history';
import { ROUTE_PRESETS, type RoutePreset } from './lib/route-presets';

export default function App() {
  /**
   * rideIds: all rides currently being tracked (1 for single, 2 for a race).
   * focusedRideId: the one shown in the Workflow Timeline.
   */
  const [rideIds, setRideIds] = useState<string[]>([]);
  const [focusedRideId, setFocusedRideId] = useState<string | null>(null);
  const [previewRoute, setPreviewRoute] = useState<RoutePreset>(ROUTE_PRESETS[0]!);
  const [bookedRoute, setBookedRoute] = useState<RoutePreset | null>(null);
  const [inspectorTab, setInspectorTab] = useState<LabInspectorTab | null>(null);

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
      last.type === 'ride.completed' ||
      last.type === 'ride.no_drivers' ||
      last.type === 'lock.acquired' ||
      last.type === 'lock.released'
    ) {
      void refreshDrivers();
    }
  }, [sseEvents, refreshDrivers]);

  /** Called by RiderPanel for both single and race flows. */
  const handleRidesCreated = useCallback((ids: string[], route: RoutePreset) => {
    setRideIds(ids);
    // Auto-focus the first ride for the workflow timeline.
    setFocusedRideId(ids[0] ?? null);
    setBookedRoute(route);
  }, []);

  const handleClear = useCallback(() => {
    setRideIds([]);
    setFocusedRideId(null);
    setBookedRoute(null);
  }, []);

  const isRace = rideIds.length > 1;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-muted/30">
      <header className="shrink-0 border-b bg-background">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
            <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
              Ride matching simulator
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Badge variant="outline" className="gap-2 bg-background py-1">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  eventsConnected ? 'bg-green-600' : 'bg-amber-500'
                }`}
                aria-hidden
              />
              {eventsConnected ? 'Live' : 'Reconnecting'}
            </Badge>

            {isRace ? (
              <>
                <Badge
                  variant="outline"
                  className="gap-1.5 border-amber-300 bg-amber-50 py-1 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  Race
                </Badge>
                {rideIds.map((id, idx) => (
                  <Button
                    key={id}
                    variant={focusedRideId === id ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-7 font-mono text-xs"
                    onClick={() => setFocusedRideId(id)}
                    title={`Inspect ride ${id} in the state graph`}
                  >
                    Ride {String.fromCharCode(65 + idx)}: {id.slice(0, 8)}
                  </Button>
                ))}
              </>
            ) : (
              focusedRideId && (
                <Badge variant="secondary" className="py-1 font-mono">
                  Ride {focusedRideId.slice(0, 8)}
                </Badge>
              )
            )}

            {focusedRideId && (
              <Button variant="ghost" size="sm" className="h-7" onClick={handleClear}>
                New ride
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 min-[840px]:grid-cols-[248px_minmax(0,1fr)_268px] min-[840px]:grid-rows-1 min-[840px]:overflow-hidden">
          <aside className="flex min-h-0 min-w-0 flex-col min-[840px]:h-full">
            <RiderPanel
              onRidesCreated={handleRidesCreated}
              onRouteChange={setPreviewRoute}
            />
          </aside>

          <section className="flex min-h-[280px] min-w-0 flex-col min-[840px]:h-full min-[840px]:min-h-0" aria-label="Booking map">
            <BookingMap
              route={bookedRoute ?? previewRoute}
              drivers={drivers}
              sseEvents={sseEvents}
              rideIds={rideIds}
              locks={locks}
            />
          </section>

          <aside className="flex min-h-0 min-w-0 flex-col min-[840px]:h-full">
            <DriverCards
              drivers={drivers}
              sseEvents={sseEvents}
              activeRideIds={rideIds}
              locks={locks}
              loading={driversLoading}
              error={driversError}
            />
          </aside>
        </main>

        <LabInspector
          tab={inspectorTab}
          onTabChange={setInspectorTab}
          eventCount={sseEvents.length}
        >
          {inspectorTab === 'graph' && (
            <WorkflowTimeline
              events={workflowEvents}
              rideId={focusedRideId}
              onClear={handleClear}
              loading={workflowLoading}
              error={workflowError}
            />
          )}
          {inspectorTab === 'events' && <EventLog events={sseEvents} />}
          {inspectorTab === 'locks' && (
            <LockStatusPanel
              drivers={drivers}
              locks={locks}
              sseEvents={sseEvents}
              rideIds={rideIds}
              error={locksError}
            />
          )}
        </LabInspector>
      </div>
    </div>
  );
}
