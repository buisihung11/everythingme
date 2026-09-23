import { useCallback, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Label,
  Separator,
  cn,
} from '@everythingme/ui';
import { RIDE_URL, postJson } from '../lib/api';
import { StepTitle } from './step-title';
import { StepDelayControl } from './step-delay-control';

const PRESETS = [
  {
    label: 'Tenderloin → Mission',
    pickup: { lat: 37.7845, lng: -122.4144, address: 'Tenderloin, SF' },
    dropoff: { lat: 37.7599, lng: -122.4148, address: 'Mission District, SF' },
  },
  {
    label: 'SoMa → Castro',
    pickup: { lat: 37.7785, lng: -122.4056, address: 'SoMa, SF' },
    dropoff: { lat: 37.7609, lng: -122.435, address: 'Castro, SF' },
  },
  {
    label: 'Marina → Chinatown',
    pickup: { lat: 37.8007, lng: -122.437, address: 'Marina, SF' },
    dropoff: { lat: 37.7949, lng: -122.4069, address: 'Chinatown, SF' },
  },
];

interface Props {
  /**
   * Called after one or more rides are created.
   * A single "Request ride" returns [id]; "Race 2 rides" returns [id1, id2].
   */
  onRidesCreated: (ids: string[]) => void;
}

function RoutePoint({
  label,
  address,
  marker,
}: {
  label: string;
  address: string;
  marker: string;
}) {
  return (
    <div className="relative flex gap-3">
      <span className={cn('mt-1 h-2.5 w-2.5 shrink-0', marker)} aria-hidden />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 font-medium">{address}</p>
      </div>
    </div>
  );
}

export function RiderPanel({ onRidesCreated }: Props) {
  const [presetIndex, setPresetIndex] = useState(0);
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<'estimate' | 'request' | 'race' | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [riderId] = useState(() => `rider-${Math.random().toString(36).slice(2, 8)}`);

  const preset = PRESETS[presetIndex];

  const handleEstimate = useCallback(async () => {
    setPendingAction('estimate');
    setError(null);
    try {
      const data = await postJson<{ fareEstimate: number }>(
        `${RIDE_URL}/fares/estimate`,
        { pickup: preset.pickup, dropoff: preset.dropoff },
      );
      setFareEstimate(data.fareEstimate);
    } catch {
      setError('Could not estimate this route. Check that the Ride Service is running.');
    } finally {
      setPendingAction(null);
    }
  }, [preset]);

  const handleRequestRide = useCallback(async () => {
    setPendingAction('request');
    setError(null);
    try {
      const data = await postJson<{ ride: { id: string } }>(`${RIDE_URL}/rides`, {
        riderId,
        pickup: preset.pickup,
        dropoff: preset.dropoff,
      });
      onRidesCreated([data.ride.id]);
    } catch {
      setError('Could not start the workflow. Check that the local services are running.');
    } finally {
      setPendingAction(null);
    }
  }, [preset, riderId, onRidesCreated]);

  /**
   * Fire two POST /rides in parallel using the same pickup preset.
   * Both SFNs will compete for the same nearby drivers — only the one that
   * acquires the Redis SET NX lock first can offer a given driver.
   */
  const handleRaceRides = useCallback(async () => {
    setPendingAction('race');
    setError(null);
    try {
      const riderIdB = `rider-${Math.random().toString(36).slice(2, 8)}`;
      const [resA, resB] = await Promise.all([
        postJson<{ ride: { id: string } }>(`${RIDE_URL}/rides`, {
          riderId,
          pickup: preset.pickup,
          dropoff: preset.dropoff,
        }),
        postJson<{ ride: { id: string } }>(`${RIDE_URL}/rides`, {
          riderId: riderIdB,
          pickup: preset.pickup,
          dropoff: preset.dropoff,
        }),
      ]);
      onRidesCreated([resA.ride.id, resB.ride.id]);
    } catch {
      setError('Could not start the race. Check that the local services are running.');
    } finally {
      setPendingAction(null);
    }
  }, [preset, riderId, onRidesCreated]);

  return (
    <Card className="min-w-0 gap-5 shadow-none">
      <CardHeader className="px-5">
        <StepTitle step={1}>Configure a ride</StepTitle>
        <CardDescription>
          Choose a route, then start the matching workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-5">
        <div className="space-y-2">
          <Label htmlFor="route-preset">Route preset</Label>
          <select
            id="route-preset"
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={presetIndex}
            onChange={(e) => {
              setPresetIndex(Number(e.target.value));
              setFareEstimate(null);
              setError(null);
            }}
            disabled={pendingAction !== null}
          >
            {PRESETS.map((p, i) => (
              <option key={p.label} value={i}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative space-y-4 rounded-lg border bg-muted/30 p-3.5 text-sm">
          <div className="absolute bottom-8 left-[1.12rem] top-8 w-px bg-border" aria-hidden />
          <RoutePoint
            label="Pickup"
            address={preset.pickup.address}
            marker="rounded-full border-[3px] border-foreground bg-background"
          />
          <RoutePoint
            label="Destination"
            address={preset.dropoff.address}
            marker="bg-foreground"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button
            variant="outline"
            className="h-11"
            onClick={handleEstimate}
            disabled={pendingAction !== null}
          >
            {pendingAction === 'estimate' ? 'Estimating…' : 'Estimate fare'}
          </Button>
          <div className="flex min-w-20 items-center justify-center rounded-md border bg-muted/40 px-3 text-sm font-semibold">
            {fareEstimate !== null ? `$${fareEstimate.toFixed(2)}` : '—'}
          </div>
        </div>

        <StepDelayControl />

        <Button
          className="h-11 w-full"
          onClick={handleRequestRide}
          disabled={pendingAction !== null}
        >
          {pendingAction === 'request' ? 'Starting workflow…' : 'Request ride'}
        </Button>

        {/* Race demo: fire two rides simultaneously against the same drivers */}
        <Button
          variant="outline"
          className="h-11 w-full border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
          onClick={handleRaceRides}
          disabled={pendingAction !== null}
          title="Fires two concurrent POST /rides so both Step Functions compete for the same drivers. Demonstrates the Redis SET NX lock."
        >
          {pendingAction === 'race' ? 'Starting race…' : '⚡ Race 2 rides'}
        </Button>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
            {error}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Simulation rider</span>
          <Badge variant="outline" className="font-mono font-normal">{riderId}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
