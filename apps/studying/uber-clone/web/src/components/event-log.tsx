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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (events.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <Card className="min-w-0 gap-4 shadow-none">
      <CardHeader className="px-5 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">Domain event stream</CardTitle>
            <CardDescription className="mt-1">
              Business events published by the Ride Service over SSE.
            </CardDescription>
          </div>
          <Badge variant="outline" className="mt-2 w-fit font-normal sm:mt-0">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 sm:px-6">
        <ScrollArea className="h-44 rounded-lg border bg-muted/20">
          {events.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center px-4 text-center">
              <p className="text-sm font-medium">No domain events yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Request a ride to populate the live stream.
              </p>
            </div>
          ) : (
            <div className="divide-y">
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
          <div ref={bottomRef} />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
