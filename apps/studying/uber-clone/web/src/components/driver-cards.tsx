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

/** Matches the offer timeout configured in the state machine. */
const OFFER_TIMEOUT_SECONDS = 10;

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
  mode: DriverMode;
  onRespond: (driverId: string, rideId: string, accept: boolean) => void;
  onOfferExpired: (driverId: string, rideId: string) => void;
  onModeChange: (mode: DriverMode) => void;
}

function DriverCard({
  driver,
  offerRideId,
  lockRideId,
  mode,
  onRespond,
  onOfferExpired,
  onModeChange,
}: DriverCardProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

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
      <CardContent className="space-y-3 p-4">
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
                title={`Lock held by ride ${lockRideId}`}
              >
                🔒 {lockRideId.slice(0, 8)}
              </Badge>
            )}
          </div>
        </div>

        {offerRideId && (
          <div className="space-y-2 rounded-md border border-amber-300 bg-background/80 p-2.5" role="status">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
              <span>Ride offer waiting</span>
              {countdown !== null && <span>{countdown} seconds</span>}
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
          className="grid w-full grid-cols-2 gap-1 sm:grid-cols-4 xl:grid-cols-2"
          spacing={4}
        >
          {DRIVER_MODES.map((m) => (
            <ToggleGroupItem
              key={m}
              value={m}
              size="sm"
              aria-label={`${driver.name}: ${MODE_LABELS[m]}`}
              className="h-9 w-full border border-transparent px-2 text-xs data-[state=on]:border-border data-[state=on]:bg-muted"
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
              Accept
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

function describeDrivers(loading: boolean, count: number): string {
  if (loading) return 'Loading nearby drivers…';
  if (count === 0) return 'No nearby drivers are registered.';
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
  const [modes, setModes] = useState<Record<string, DriverMode>>({});

  const lockByDriver = resolveDriverLocks(locks, drivers, sseEvents);

  useEffect(() => {
    const last = sseEvents.at(-1);
    if (!last) return;

    // Only respond to ride / offer lifecycle events (not lock events)
    if (
      last.type !== 'ride.matched' &&
      last.type !== 'ride.no_drivers' &&
      last.type !== 'offer.created' &&
      last.type !== 'offer.accepted' &&
      last.type !== 'offer.declined' &&
      last.type !== 'offer.timeout'
    ) {
      return;
    }

    if (last.type === 'ride.matched' || last.type === 'ride.no_drivers') {
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
      // A Standard workflow offers to only one driver at a time. Replacing
      // the map also clears a prior offer if its timeout event was not emitted.
      setPendingOffers((prev) => ({ ...prev, [last.driverId]: last.rideId }));
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

  const handleOfferExpired = useCallback(
    (driverId: string, rideId: string) => {
      setPendingOffers((prev) =>
        prev[driverId] === rideId ? withoutDriver(prev, driverId) : prev,
      );
    },
    [],
  );

  function renderDrivers() {
    if (error && drivers.length === 0) return <LocationServiceUnavailable />;
    if (loading) return <DriverSkeletons />;
    if (drivers.length === 0) return <NoDriversRegistered />;

    return drivers.map((d) => (
      <DriverCard
        key={d.id}
        driver={d}
        offerRideId={pendingOffers[d.id] ?? null}
        lockRideId={lockByDriver[d.id]?.rideId}
        mode={modes[d.id] ?? 'manual'}
        onRespond={handleRespond}
        onOfferExpired={handleOfferExpired}
        onModeChange={(m) => handleModeChange(d.id, m)}
      />
    ));
  }

  return (
    <Card className="min-w-0 gap-5 shadow-none">
      <CardHeader className="px-5">
        <StepTitle step={2}>Simulate drivers</StepTitle>
        <CardDescription>
          {describeDrivers(loading, drivers.length)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-5">
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
