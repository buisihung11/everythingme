import { useEffect, useRef, type ComponentProps } from 'react';
import type { DomainEvent } from '@studying/uber-clone/shared';
import type { AnyEvent } from '../lib/lock-types';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
} from '@everythingme/ui';

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>['variant']>;

interface Props {
  events: AnyEvent[];
}

const EVENT_VARIANTS: Partial<Record<AnyEvent['type'], BadgeVariant>> = {
  'ride.created': 'secondary',
  'ride.matching': 'outline',
  'offer.created': 'outline',
  'offer.accepted': 'default',
  'offer.declined': 'destructive',
  'offer.timeout': 'destructive',
  'ride.matched': 'default',
  'ride.completed': 'secondary',
  'ride.no_drivers': 'destructive',
  // lock events
  'lock.acquired': 'default',
  'lock.denied': 'destructive',
  'lock.released': 'secondary',
};

function formatEvent(e: AnyEvent): string {
  switch (e.type) {
    case 'ride.created':
      return `Ride created ${e.rideId.slice(0, 8)}…`;
    case 'ride.matching':
      return 'Searching for drivers…';
    case 'offer.created':
      return `Offer #${(e as DomainEvent & { offerIndex: number }).offerIndex + 1} → ${e.driverId}`;
    case 'offer.accepted':
      return `${e.driverId} accepted`;
    case 'offer.declined':
      return `${e.driverId} declined`;
    case 'offer.timeout':
      return `${e.driverId} timed out`;
    case 'ride.matched':
      return `Matched with ${e.driverId}`;
    case 'ride.completed':
      return `Trip complete — ${e.driverId} is free`;
    case 'ride.no_drivers':
      return 'No drivers available';
    // lock events
    case 'lock.acquired':
      return `Lock acquired: driver ${e.driverId.slice(0, 8)} → ride ${e.rideId.slice(0, 8)}`;
    case 'lock.denied': {
      const denied = e;
      return `Lock denied: driver ${denied.driverId.slice(0, 8)} held by ride ${denied.heldBy.slice(0, 8)}`;
    }
    case 'lock.released':
      return `Lock released: driver ${e.driverId.slice(0, 8)}`;
    // SSE payloads are not validated, so show the raw type of unknown events.
    default:
      return (e as AnyEvent).type;
  }
}

/** Returns the rideId field common to all events, if present. */
function getRideId(e: AnyEvent): string | undefined {
  return 'rideId' in e ? (e as { rideId: string }).rideId : undefined;
}

export function EventLog({ events }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = listRef.current?.closest<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [events.length]);

  return (
    <Card className="h-full min-h-0 gap-3 py-4 shadow-none">
      <CardHeader className="shrink-0 px-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <CardTitle className="text-base">Domain event stream</CardTitle>
            <CardDescription className="mt-1">
              Business events published by the Ride Service over SSE.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit font-normal">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-5">
        <ScrollArea className="h-full rounded-lg border bg-muted/20">
          {events.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center px-4 text-center">
              <p className="text-sm font-medium">No domain events yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Request a ride to populate the live stream.
              </p>
            </div>
          ) : (
            <div ref={listRef} className="divide-y">
              {events.map((e, i) => {
                const rideId = getRideId(e);
                return (
                  <div key={i} className="flex min-h-11 items-center gap-3 px-3 py-2 text-xs">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-[10px] text-muted-foreground">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Badge
                      variant={EVENT_VARIANTS[e.type] ?? 'outline'}
                      className="shrink-0 font-normal"
                    >
                      {e.type}
                    </Badge>
                    <span className="min-w-0 truncate text-muted-foreground">
                      {formatEvent(e)}
                    </span>
                    {rideId && (
                      <span className="ml-auto hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:block">
                        {rideId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
