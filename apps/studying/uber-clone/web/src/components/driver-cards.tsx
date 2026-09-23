import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import type { AnyEvent, LockInfo } from '../lib/lock-types';
import { resolveDriverLocks } from '../lib/lock-types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Progress,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@everythingme/ui';
import type { DriverInfo } from '../hooks/use-drivers';
import { RIDE_URL, postJson } from '../lib/api';
import { RIDE_LANE_COLORS, rideLaneFor, rideLaneTitle } from '../lib/booking-map-state';
import { StepTitle } from './step-title';

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>['variant']>;

const DRIVER_MODES = [
  'manual',
  'auto-accept',
  'auto-decline',
  'ignore',
] as const;
type DriverMode = (typeof DRIVER_MODES)[number];

const MODE_LABELS: Record<DriverMode, string> = {
  manual: 'Manual',
  'auto-accept': 'Accept',
  'auto-decline': 'Decline',
  ignore: 'Ignore',
};

/** How long an automatic driver waits before answering; null means never. */
const AUTO_RESPONSE_DELAY_MS: Record<DriverMode, number | null> = {
  manual: null,
  'auto-accept': 1500,
  'auto-decline': 2000,
  ignore: null,
};

/** Matches the driver response window in OfferToDriver (ASL TimeoutSeconds minus step-delay headroom). */
const OFFER_TIMEOUT_SECONDS = 60;
/** Offer locks last 90s; matched locks last 3600s. */
const MATCHED_LOCK_TTL_HINT = 120;

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  available: 'default',
  busy: 'secondary',
};

/** Driver id → id of the ride whose offer is waiting on that driver. */
type PendingOffers = Record<string, string>;

function withoutDriver(offers: PendingOffers, driverId: string): PendingOffers {
  const { [driverId]: _removed, ...rest } = offers;
  return rest;
}

interface DriverCardProps {
  driver: DriverInfo;
  offerRideId: string | null;
  lockRideId: string | undefined;
  completeRideId: string | null;
  activeRideIds: string[];
  mode: DriverMode;
  onRespond: (driverId: string, rideId: string, accept: boolean) => void;
  onOfferExpired: (driverId: string, rideId: string) => void;
  onModeChange: (mode: DriverMode) => void;
  onComplete: (rideId: string) => void;
}

function DriverCard({
  driver,
  offerRideId,
  lockRideId,
  completeRideId,
  activeRideIds,
  mode,
  onRespond,
  onOfferExpired,
  onModeChange,
  onComplete,
}: DriverCardProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const offerLane = offerRideId ? rideLaneTitle(activeRideIds, offerRideId) : null;
  const lockLane = lockRideId ? rideLaneTitle(activeRideIds, lockRideId) : null;
  const completeLane = completeRideId ? rideLaneTitle(activeRideIds, completeRideId) : null;
  const offerColor = offerRideId
    ? RIDE_LANE_COLORS[rideLaneFor(activeRideIds, offerRideId)]
    : undefined;

  useEffect(() => {
    if (!offerRideId) {
      setCountdown(null);
      return;
    }

    setCountdown(OFFER_TIMEOUT_SECONDS);
    const id = setInterval(() => {
      setCountdown((remaining) =>
        remaining !== null && remaining > 1 ? remaining - 1 : null,
      );
    }, 1000);
    const expiryId = setTimeout(() => {
      onOfferExpired(driver.id, offerRideId);
    }, OFFER_TIMEOUT_SECONDS * 1000);

    return () => {
      clearInterval(id);
      clearTimeout(expiryId);
    };
  }, [driver.id, offerRideId, onOfferExpired]);

  useEffect(() => {
    const delay = AUTO_RESPONSE_DELAY_MS[mode];
    if (!offerRideId || delay === null) return;

    const id = setTimeout(() => {
      onRespond(driver.id, offerRideId, mode === 'auto-accept');
    }, delay);
    return () => clearTimeout(id);
  }, [offerRideId, mode, driver.id, onRespond]);

  return (
    <Card
      className={cn(
        'gap-0 py-0 shadow-none transition-colors',
        offerRideId && 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/15',
      )}
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{driver.name}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
              {driver.id}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge
              variant={STATUS_VARIANTS[driver.status] ?? 'outline'}
              className="capitalize"
            >
              {driver.status}
            </Badge>
            {lockRideId && (
              <Badge
                variant="outline"
                className="font-mono text-[10px] font-normal text-amber-700 border-amber-400"
                title={`Lock held by ${lockLane ?? lockRideId}`}
              >
                🔒 {lockLane ?? lockRideId.slice(0, 8)}
              </Badge>
            )}
          </div>
        </div>

        {offerRideId && (
          <div className="space-y-2 rounded-md border border-amber-300 bg-background/80 p-2.5" role="status">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-amber-800">
              <span className="flex min-w-0 items-center gap-1.5">
                {offerLane && (
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: offerColor }}
                    aria-hidden
                  />
                )}
                <span className="truncate">
                  {offerLane ? `${offerLane} offer` : 'Ride offer'} waiting
                </span>
              </span>
              {countdown !== null && <span className="shrink-0">{countdown}s</span>}
            </div>
            {countdown !== null && (
              <Progress
                value={(countdown / OFFER_TIMEOUT_SECONDS) * 100}
                className="h-1.5"
              />
            )}
          </div>
        )}

        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && onModeChange(v as DriverMode)}
          aria-label={`Response mode for ${driver.name}`}
          className="grid w-full grid-cols-4 gap-1"
          spacing={4}
        >
          {DRIVER_MODES.map((m) => (
            <ToggleGroupItem
              key={m}
              value={m}
              size="sm"
              aria-label={`${driver.name}: ${MODE_LABELS[m]}`}
              className="h-7 w-full border border-transparent px-2 text-xs data-[state=on]:border-border data-[state=on]:bg-muted"
            >
              {MODE_LABELS[m]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {offerRideId && mode === 'manual' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onRespond(driver.id, offerRideId, true)}
            >
              Accept{offerLane ? ` ${offerLane}` : ''}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => onRespond(driver.id, offerRideId, false)}
            >
              Decline
            </Button>
          </div>
        )}

        {completeRideId && !offerRideId && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onComplete(completeRideId)}
          >
            Complete{completeLane ? ` ${completeLane}` : ' ride'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function LocationServiceUnavailable() {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
      <p className="text-sm font-medium text-destructive">Location Service unavailable</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Start the local services, then this panel will reconnect automatically.
      </p>
    </div>
  );
}

function DriverSkeletons() {
  return (
    <div className="space-y-2" aria-label="Loading drivers">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-24 animate-pulse rounded-lg border bg-muted/60" />
      ))}
    </div>
  );
}

function NoDriversRegistered() {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
      <p className="text-sm font-medium">No drivers available</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Seed the local database with <code className="rounded bg-muted px-1.5 py-0.5 font-mono">pnpm seed</code>.
      </p>
    </div>
  );
}

function describeDrivers(loading: boolean, count: number, race: boolean): string {
  if (loading) return 'Loading nearby drivers…';
  if (count === 0) return 'No nearby drivers are registered.';
  if (race) {
    return 'Two rides matching in parallel. Each offer is locked to one ride — a driver cannot take both.';
  }
  return `${count} nearby drivers. Choose how each responds.`;
}

interface Props {
  drivers: DriverInfo[];
  sseEvents: AnyEvent[];
  /** All currently tracked race ride IDs (one or two). */
  activeRideIds: string[];
  /** Current lock snapshot from GET /locks. */
  locks: LockInfo[];
  loading: boolean;
  error: boolean;
}

export function DriverCards({
  drivers,
  sseEvents,
  activeRideIds,
  locks = [],
  loading,
  error,
}: Props) {
  const [pendingOffers, setPendingOffers] = useState<PendingOffers>({});
  const [matchedRides, setMatchedRides] = useState<PendingOffers>({});
  const [modes, setModes] = useState<Record<string, DriverMode>>({});

  const lockByDriver = resolveDriverLocks(locks, drivers, sseEvents);

  useEffect(() => {
    const last = sseEvents.at(-1);
    if (!last) return;

    // Only respond to ride / offer lifecycle events (not lock events)
    if (
      last.type !== 'ride.matched' &&
      last.type !== 'ride.completed' &&
      last.type !== 'ride.no_drivers' &&
      last.type !== 'offer.created' &&
      last.type !== 'offer.accepted' &&
      last.type !== 'offer.declined' &&
      last.type !== 'offer.timeout'
    ) {
      return;
    }

    if (last.type === 'ride.matched') {
      setMatchedRides((prev) => ({ ...prev, [last.driverId]: last.rideId }));
      setPendingOffers((prev) => {
        const next = { ...prev };
        for (const [dId, rId] of Object.entries(next)) {
          if (rId === last.rideId) delete next[dId];
        }
        return next;
      });
      return;
    }

    if (last.type === 'ride.completed') {
      setMatchedRides((prev) => withoutDriver(prev, last.driverId));
      return;
    }

    if (last.type === 'ride.no_drivers') {
      // Only clear offers belonging to this specific ride
      setPendingOffers((prev) => {
        const next = { ...prev };
        for (const [dId, rId] of Object.entries(next)) {
          if (rId === last.rideId) delete next[dId];
        }
        return next;
      });
      return;
    }

    // Ignore events from rides we're not tracking
    if (!activeRideIds.includes(last.rideId)) return;

    if (last.type === 'offer.created') {
      // One pending offer per ride. A race can therefore show two cards at
      // once — each card is locked to a different rideId.
      setPendingOffers((prev) => {
        const next: PendingOffers = {};
        for (const [driverId, rideId] of Object.entries(prev)) {
          if (rideId !== last.rideId) next[driverId] = rideId;
        }
        next[last.driverId] = last.rideId;
        return next;
      });
    } else if (
      last.type === 'offer.accepted' ||
      last.type === 'offer.declined' ||
      last.type === 'offer.timeout'
    ) {
      setPendingOffers((prev) => withoutDriver(prev, last.driverId));
    }
  }, [sseEvents, activeRideIds]);

  const handleRespond = useCallback(
    async (driverId: string, rideId: string, accept: boolean) => {
      setPendingOffers((prev) => withoutDriver(prev, driverId));

      try {
        await postJson(
          `${RIDE_URL}/rides/${rideId}/offers/${driverId}/respond`,
          { accept },
        );
      } catch (err) {
        console.error('Respond error:', err);
      }
    },
    [],
  );

  const handleModeChange = useCallback((driverId: string, mode: DriverMode) => {
    setModes((prev) => ({ ...prev, [driverId]: mode }));
  }, []);

  const handleComplete = useCallback(async (rideId: string) => {
    setMatchedRides((prev) => {
      const next = { ...prev };
      for (const [driverId, matchedRideId] of Object.entries(next)) {
        if (matchedRideId === rideId) delete next[driverId];
      }
      return next;
    });
    try {
      await postJson(`${RIDE_URL}/rides/${rideId}/complete`, {});
    } catch (err) {
      console.error('Complete ride error:', err);
    }
  }, []);

  const handleOfferExpired = useCallback(
    (driverId: string, rideId: string) => {
      setPendingOffers((prev) =>
        prev[driverId] === rideId ? withoutDriver(prev, driverId) : prev,
      );
    },
    [],
  );

  function completableRideId(driverId: string): string | null {
    if (pendingOffers[driverId]) return null;
    if (matchedRides[driverId]) return matchedRides[driverId];
    const lock = lockByDriver[driverId];
    if (lock && (lock.ttlSeconds == null || lock.ttlSeconds > MATCHED_LOCK_TTL_HINT)) {
      return lock.rideId;
    }
    return null;
  }

  function renderDrivers() {
    if (error && drivers.length === 0) return <LocationServiceUnavailable />;
    if (loading) return <DriverSkeletons />;
    if (drivers.length === 0) return <NoDriversRegistered />;

    // Pending offers first, then locked drivers, otherwise keep registry order.
    const priority = (id: string) =>
      (pendingOffers[id] ? 3 : 0) + (completableRideId(id) ? 2 : 0) + (lockByDriver[id] ? 1 : 0);
    const ranked = [...drivers].sort((a, b) => priority(b.id) - priority(a.id));

    return ranked.map((d) => (
      <DriverCard
        key={d.id}
        driver={d}
        offerRideId={pendingOffers[d.id] ?? null}
        lockRideId={lockByDriver[d.id]?.rideId}
        completeRideId={completableRideId(d.id)}
        activeRideIds={activeRideIds}
        mode={modes[d.id] ?? 'manual'}
        onRespond={handleRespond}
        onOfferExpired={handleOfferExpired}
        onModeChange={(m) => handleModeChange(d.id, m)}
        onComplete={handleComplete}
      />
    ));
  }

  return (
    <Card className="h-full min-h-0 gap-3 py-4 shadow-none">
      <CardHeader className="shrink-0 px-4">
        <StepTitle step={2}>Simulate drivers</StepTitle>
        <CardDescription>
          {describeDrivers(loading, drivers.length, activeRideIds.length > 1)}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4">
        {renderDrivers()}
        {drivers.length > 0 && activeRideIds.length === 0 && (
          <p className="pt-2 text-xs leading-5 text-muted-foreground">
            Manual mode pauses for your response. Automatic modes act when an
            offer reaches that driver.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
