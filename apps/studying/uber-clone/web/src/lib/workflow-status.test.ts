import { describe, expect, it } from 'vitest';
import type { HistoryEvent } from '../hooks/use-workflow-history';
import {
  deriveWorkflowRuntime,
  formatEventType,
  isCatchEvent,
} from './workflow-status';

function stateEntered(name: string): HistoryEvent {
  return {
    id: 1,
    type: 'TaskStateEntered',
    timestamp: '2026-01-01T00:00:00Z',
    stateEnteredEventDetails: { name },
  };
}

function stateExited(name: string): HistoryEvent {
  return {
    id: 2,
    type: 'TaskStateExited',
    timestamp: '2026-01-01T00:00:01Z',
    stateExitedEventDetails: { name },
  };
}

describe('isCatchEvent', () => {
  it('flags decline and timeout errors the state machine catches', () => {
    expect(
      isCatchEvent({
        id: 1,
        type: 'ActivityFailed',
        timestamp: '',
        activityFailedEventDetails: { error: 'DriverDeclined', cause: '' },
      }),
    ).toBe(true);
    expect(
      isCatchEvent({
        id: 2,
        type: 'ActivityFailed',
        timestamp: '',
        activityFailedEventDetails: { error: 'States.Timeout', cause: '' },
      }),
    ).toBe(true);
    expect(
      isCatchEvent({
        id: 3,
        type: 'ActivityFailed',
        timestamp: '',
        activityFailedEventDetails: { error: 'TaskFailed', cause: '' },
      }),
    ).toBe(false);
  });
});

describe('deriveWorkflowRuntime', () => {
  it('tracks active state visits and completion on success', () => {
    const events: HistoryEvent[] = [
      stateEntered('FetchCandidates'),
      stateExited('FetchCandidates'),
      stateEntered('OfferToDriver'),
      { id: 9, type: 'ExecutionSucceeded', timestamp: '' },
    ];

    const runtime = deriveWorkflowRuntime(events);

    expect(runtime.states.FetchCandidates).toEqual({
      status: 'completed',
      visits: 1,
    });
    expect(runtime.states.OfferToDriver.status).toBe('active');
    expect(runtime.activeState).toBeNull();
    expect(runtime.isComplete).toBe(true);
    expect(runtime.succeeded).toBe(true);
    expect(runtime.states.NotifyMatched.status).toBe('completed');
  });

  it('counts catchable activity failures (decline / offer timeout)', () => {
    const events: HistoryEvent[] = [
      stateEntered('OfferToDriver'),
      {
        id: 3,
        type: 'ActivityFailed',
        timestamp: '',
        activityFailedEventDetails: { error: 'DriverDeclined', cause: '' },
      },
    ];

    const runtime = deriveWorkflowRuntime(events);

    expect(runtime.catchCount).toBe(1);
    expect(runtime.states.OfferToDriver.visits).toBe(1);
  });

  it('marks MatchingFailed on execution failure', () => {
    const runtime = deriveWorkflowRuntime([
      { id: 1, type: 'ExecutionFailed', timestamp: '' },
    ]);

    expect(runtime.isComplete).toBe(true);
    expect(runtime.succeeded).toBe(false);
    expect(runtime.states.MatchingFailed.status).toBe('error');
  });
});

describe('formatEventType', () => {
  it('inserts spaces before capitals and replaces underscores', () => {
    expect(formatEventType('ExecutionSucceeded')).toBe('Execution Succeeded');
    expect(formatEventType('Task_StateEntered')).toBe('Task  State Entered');
  });
});
