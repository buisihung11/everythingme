import { describe, expect, it } from 'vitest';
import type { HistoryEvent } from '../hooks/use-workflow-history';
import {
  deriveWorkflowRuntime,
  formatEventType,
  isCatchEvent,
} from './workflow-status';

function enter(name: string): HistoryEvent {
  return {
    id: 1,
    type: 'TaskStateEntered',
    timestamp: '2026-01-01T00:00:00Z',
    stateEnteredEventDetails: { name },
  };
}

function exit(name: string): HistoryEvent {
  return {
    id: 2,
    type: 'TaskStateExited',
    timestamp: '2026-01-01T00:00:01Z',
    stateExitedEventDetails: { name },
  };
}

describe('isCatchEvent', () => {
  it('flags DriverDeclined and States.Timeout as catchable', () => {
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
  });

  it('ignores other activity errors', () => {
    expect(
      isCatchEvent({
        id: 3,
        type: 'ActivityFailed',
        timestamp: '',
        activityFailedEventDetails: { error: 'DriverLocked', cause: '' },
      }),
    ).toBe(false);
  });
});

describe('deriveWorkflowRuntime', () => {
  it('tracks state visits and marks the last open state active', () => {
    const runtime = deriveWorkflowRuntime([
      enter('FetchCandidates'),
      exit('FetchCandidates'),
      enter('OfferToDriver'),
    ]);

    expect(runtime.states.FetchCandidates).toEqual({
      status: 'completed',
      visits: 1,
    });
    expect(runtime.states.OfferToDriver).toEqual({ status: 'active', visits: 1 });
    expect(runtime.activeState).toBe('OfferToDriver');
    expect(runtime.isComplete).toBe(false);
  });

  it('counts catch events while OfferToDriver is still the open state', () => {
    const runtime = deriveWorkflowRuntime([
      enter('OfferToDriver'),
      {
        id: 9,
        type: 'ActivityFailed',
        timestamp: '',
        activityFailedEventDetails: { error: 'DriverDeclined', cause: '' },
      },
    ]);

    expect(runtime.catchCount).toBe(1);
    expect(runtime.activeState).toBe('OfferToDriver');
    expect(runtime.states.OfferToDriver.status).toBe('active');
  });

  it('marks success when execution succeeds', () => {
    const runtime = deriveWorkflowRuntime([
      enter('NotifyMatched'),
      exit('NotifyMatched'),
      { id: 99, type: 'ExecutionSucceeded', timestamp: '' },
    ]);

    expect(runtime.isComplete).toBe(true);
    expect(runtime.succeeded).toBe(true);
    expect(runtime.activeState).toBeNull();
    expect(runtime.states.NotifyMatched.status).toBe('completed');
  });

  it('marks MatchingFailed on execution failure', () => {
    const runtime = deriveWorkflowRuntime([
      enter('MatchingFailed'),
      { id: 100, type: 'ExecutionFailed', timestamp: '' },
    ]);

    expect(runtime.isComplete).toBe(true);
    expect(runtime.succeeded).toBe(false);
    expect(runtime.states.MatchingFailed.status).toBe('error');
  });
});

describe('formatEventType', () => {
  it('inserts spaces before capitals and replaces underscores', () => {
    expect(formatEventType('TaskStateEntered')).toBe('Task State Entered');
    expect(formatEventType('Execution_Succeeded')).toBe('Execution  Succeeded');
  });
});
