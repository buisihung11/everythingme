import { useMemo, type ComponentProps, type ReactNode } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  ScrollArea,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@everythingme/ui';
import type { HistoryEvent } from '../hooks/use-workflow-history';
import {
  deriveWorkflowRuntime,
  formatEventType,
  isCatchEvent,
  type WorkflowRuntime,
} from '../lib/workflow-status';
import {
  WORKFLOW_STATE_META,
  type WorkflowStateKind,
  type WorkflowStateName,
} from '../lib/workflow-definition';
import { StepTitle } from './step-title';
import { WorkflowGraph } from './workflow-graph';

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>['variant']>;

interface Props {
  events: HistoryEvent[];
  rideId: string | null;
  onClear: () => void;
  loading: boolean;
  error: boolean;
}

const KIND_BADGE_VARIANTS: Partial<Record<WorkflowStateKind, BadgeVariant>> = {
  fail: 'destructive',
  task: 'default',
};

const EXECUTION_STATUS = {
  ready: { label: 'Ready', dot: 'bg-muted-foreground' },
  starting: { label: 'Starting', dot: 'bg-muted-foreground' },
  running: { label: 'Running', dot: 'animate-pulse bg-blue-600' },
  succeeded: { label: 'Succeeded', dot: 'bg-green-600' },
  failed: { label: 'Failed', dot: 'bg-destructive' },
  disconnected: { label: 'Disconnected', dot: 'bg-destructive' },
} as const;

function resolveExecutionStatus(
  rideId: string | null,
  error: boolean,
  runtime: WorkflowRuntime,
) {
  if (!rideId) return EXECUTION_STATUS.ready;
  if (error) return EXECUTION_STATUS.disconnected;
  if (runtime.isComplete) {
    return runtime.succeeded
      ? EXECUTION_STATUS.succeeded
      : EXECUTION_STATUS.failed;
  }
  return runtime.activeState
    ? EXECUTION_STATUS.running
    : EXECUTION_STATUS.starting;
}

function StateBadge({ name }: { name: string }) {
  const meta = WORKFLOW_STATE_META[name as WorkflowStateName];

  return (
    <Badge
      variant={(meta && KIND_BADGE_VARIANTS[meta.kind]) ?? 'secondary'}
      className="font-mono text-[10px]"
    >
      {name}
    </Badge>
  );
}

function LegendItem({
  swatch,
  children,
}: {
  swatch: string;
  children: ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={swatch} />
      {children}
    </span>
  );
}

function EventList({ events }: { events: HistoryEvent[] }) {
  if (events.length === 0) {
    return (
      <Empty className="border border-dashed py-10">
        <EmptyHeader>
          <EmptyTitle>Waiting for execution history</EmptyTitle>
          <EmptyDescription>
            State transitions appear here as Step Functions reports them.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ScrollArea className="h-full min-h-0 pr-3">
      <div className="space-y-2">
        {events.map((e) => {
          const stateName =
            e.stateEnteredEventDetails?.name ?? e.stateExitedEventDetails?.name;

          return (
            <div
              key={e.id}
              className="flex items-start gap-3 border-l-2 border-border py-1 pl-3 text-xs"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-muted-foreground">
                    {formatEventType(e.type)}
                  </span>
                  {stateName && <StateBadge name={stateName} />}
                  {isCatchEvent(e) && (
                    <Badge
                      variant="outline"
                      className="border-orange-400 text-orange-700 bg-orange-50"
                    >
                      Catch → AdvanceCursor
                    </Badge>
                  )}
                </div>
                {e.executionFailedEventDetails && (
                  <p className="text-destructive">
                    {e.executionFailedEventDetails.error}:{' '}
                    {e.executionFailedEventDetails.cause}
                  </p>
                )}
                <p className="font-mono text-[10px] text-muted-foreground">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function WorkflowTimeline({
  events,
  rideId,
  onClear,
  loading,
  error,
}: Props) {
  const runtime = useMemo(() => deriveWorkflowRuntime(events), [events]);
  const status = resolveExecutionStatus(rideId, error, runtime);
  const stateTransitionCount = events.filter((e) =>
    e.type.includes('Entered'),
  ).length;

  return (
    <Card className="h-full min-h-0 gap-3 overflow-hidden py-4 shadow-none">
      <CardHeader className="shrink-0 px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <StepTitle step={3}>Observe the workflow</StepTitle>
            <CardDescription>Live AWS Step Functions execution and state history.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={runtime.isComplete && !runtime.succeeded ? 'destructive' : 'outline'}
              className="w-fit shrink-0 gap-2"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                aria-hidden
              />
              {status.label}
            </Badge>
            {rideId && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                New ride
              </Button>
            )}
          </div>
        </div>
        <div className="flex min-h-6 flex-wrap items-center gap-2 pt-1">
          {rideId && (
            <span className="font-mono text-xs text-muted-foreground">
              Ride {rideId.slice(0, 12)}
            </span>
          )}
          {runtime.activeState && (
            <Badge>Current: {runtime.activeState}</Badge>
          )}
          {runtime.catchCount > 0 && (
            <Badge variant="outline" className="text-orange-700">
              {runtime.catchCount} catch
              {runtime.catchCount !== 1 ? 'es' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden px-5">
        {!rideId && (
          <Empty className="border bg-muted/30 py-6">
            <EmptyHeader>
              <EmptyTitle>The state machine is ready</EmptyTitle>
              <EmptyDescription>
                Configure a ride to watch the graph progress from candidate
                lookup through offer handling and its success or failure path.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {loading && rideId && events.length === 0 && (
          <Alert>
            <AlertDescription>
              Starting execution and loading its first state…
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Execution history unavailable</AlertTitle>
            <AlertDescription>
              The Matching Service will be polled again automatically.
            </AlertDescription>
          </Alert>
        )}
        <Tabs defaultValue="graph" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid h-10 w-full shrink-0 grid-cols-2 sm:w-72">
            <TabsTrigger value="graph">State graph</TabsTrigger>
            <TabsTrigger value="events">Execution history</TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <WorkflowGraph runtime={runtime} />
            <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <LegendItem swatch="h-2 w-2 rounded-full bg-blue-600">Active state</LegendItem>
              <LegendItem swatch="h-2 w-2 rounded-full bg-green-600">Completed</LegendItem>
              <LegendItem swatch="h-0.5 w-3 bg-amber-500">Timeout or decline path</LegendItem>
              <span>Drag a state to rearrange · click it for details · scroll to pan</span>
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-3 min-h-0 flex-1 overflow-hidden">
            <EventList events={events} />
          </TabsContent>
        </Tabs>

        <Separator />
        <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>{stateTransitionCount} state transitions</span>
          <span>{events.length} execution events</span>
        </div>
      </CardContent>
    </Card>
  );
}
