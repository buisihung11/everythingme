import { useEffect, type ReactNode } from 'react';
import { Badge, Button, cn } from '@everythingme/ui';

export type LabInspectorTab = 'graph' | 'events' | 'locks';

const TABS: Array<{ id: LabInspectorTab; label: string }> = [
  { id: 'graph', label: 'State graph' },
  { id: 'events', label: 'Event stream' },
  { id: 'locks', label: 'Locks' },
];

interface Props {
  tab: LabInspectorTab | null;
  onTabChange: (tab: LabInspectorTab | null) => void;
  eventCount: number;
  children: ReactNode;
}

export function LabInspector({ tab, onTabChange, eventCount, children }: Props) {
  useEffect(() => {
    if (!tab) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onTabChange(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tab, onTabChange]);

  return (
    <>
      {tab && (
        <div className="absolute inset-x-0 bottom-11 top-[10%] z-20 flex min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-lg">
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1 border-t bg-background px-2 py-1">
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <Button
              key={id}
              type="button"
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('h-8 gap-1.5 px-2.5 text-xs', active && 'bg-muted')}
              onClick={() => onTabChange(active ? null : id)}
              aria-pressed={active}
            >
              {label}
              {id === 'events' && eventCount > 0 && (
                <Badge variant="outline" className="h-4 min-w-4 px-1 font-mono text-[10px]">
                  {eventCount}
                </Badge>
              )}
            </Button>
          );
        })}
        <p className="ml-auto hidden font-mono text-[10px] text-muted-foreground sm:block">
          SFN 8083 · Redis 6380 · Postgres 5433 · APIs 4401–4403
        </p>
      </div>
    </>
  );
}
