import type { HistoryEvent } from '../hooks/use-workflow-history';
import {
  WORKFLOW_STATE_NAMES,
  type WorkflowStateName,
} from './workflow-definition';

export type StateStatus = 'idle' | 'active' | 'completed' | 'error';

export interface StateRuntime {
  status: StateStatus;
  visits: number;
}

export interface WorkflowRuntime {
  states: Record<WorkflowStateName, StateRuntime>;
  activeState: WorkflowStateName | null;
  isComplete: boolean;
  succeeded: boolean;
  catchCount: number;
}

/** Errors the state machine catches to fall through to AdvanceCursor. */
const CATCH_ERRORS = new Set(['DriverDeclined', 'States.Timeout']);

const KNOWN_STATES = new Set<string>(WORKFLOW_STATE_NAMES);

function isWorkflowState(name: string | undefined): name is WorkflowStateName {
  return name !== undefined && KNOWN_STATES.has(name);
}

export function isCatchEvent(event: HistoryEvent): boolean {
  const error = event.activityFailedEventDetails?.error;
  return error !== undefined && CATCH_ERRORS.has(error);
}

function emptyRuntime(): Record<WorkflowStateName, StateRuntime> {
  return Object.fromEntries(
    WORKFLOW_STATE_NAMES.map((name) => [name, { status: 'idle', visits: 0 }]),
  ) as Record<WorkflowStateName, StateRuntime>;
}

export function deriveWorkflowRuntime(events: HistoryEvent[]): WorkflowRuntime {
  const states = emptyRuntime();
  const openStates = new Set<WorkflowStateName>();
  let activeState: WorkflowStateName | null = null;
  let catchCount = 0;

  for (const event of events) {
    const entered = event.stateEnteredEventDetails?.name;
    const exited = event.stateExitedEventDetails?.name;

    if (isWorkflowState(entered)) {
      states[entered].visits += 1;
      states[entered].status = 'active';
      openStates.add(entered);
      activeState = entered;
    }

    if (isWorkflowState(exited)) {
      openStates.delete(exited);
      if (states[exited].status !== 'error') {
        states[exited].status = 'completed';
      }
    }

    if (isCatchEvent(event)) {
      catchCount += 1;
      if (openStates.has('OfferToDriver')) {
        states.OfferToDriver.status = 'error';
      }
    }
  }

  // Any state entered but never exited is still running.
  for (const name of openStates) {
    states[name].status = 'active';
    activeState = name;
  }

  const last = events[events.length - 1];
  const succeeded = last?.type === 'ExecutionSucceeded';
  const isComplete = succeeded || last?.type === 'ExecutionFailed';

  if (isComplete) {
    if (succeeded) {
      states.NotifyMatched.status = 'completed';
    } else {
      states.MatchingFailed.status = 'error';
    }
    activeState = null;
  }

  return { states, activeState, isComplete, succeeded, catchCount };
}

export function formatEventType(type: string): string {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim();
}
