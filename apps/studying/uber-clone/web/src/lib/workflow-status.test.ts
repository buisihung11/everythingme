import { describe, expect, it } from 'vitest';
import type { HistoryEvent } from '../hooks/use-workflow-history';
import {
  deriveWorkflowRuntime,
  formatEventType,
  isCatchEvent,
} from './workflow-status';

describe('isCatchEvent', () => {
  it('flags Step Functions errors that advance the cursor', () => {
    expect(
      isCatchEvent({
        type: 'TaskFailed',
        activityFailedEventDetails: { error: 'DriverDeclined' },
      }),
    ).toBe(true);
    expect(
      isCatchEvent({
        type: 'TaskFailed',
        activityFailedEventDetails: { error: 'States.Timeout' },
      }),
    ).toBe(true);
    expect(
      isCatchEvent({
        type: 'TaskFailed',
        activityFailedEventDetails: { error: 'SomethingElse' },
      }),
    ).toBe(false);
  });
});

describe('deriveWorkflowRuntime', () => {
  it('counts catchable offer failures and keeps OfferToDriver in error after exit', () => {
    const events: HistoryEvent[] = [
      {
        type: 'TaskStateEntered',
        stateEnteredEventDetails: { name: 'OfferToDriver' },
      },
      {
        type: 'TaskFailed',
        activityFailedEventDetails: { error: 'DriverDeclined' },
      },
      {
        type: 'TaskStateExited',
        stateExitedEventDetails: { name: 'OfferToDriver' },
      },
    ];

    const runtime = deriveWorkflowRuntime(events);

    expect(runtime.catchCount).toBe(1);
    expect(runtime.states.OfferToDriver.status).toBe('error');
  });

  it('marks NotifyMatched completed on ExecutionSucceeded', () => {
    const events: HistoryEvent[] = [
      {
        type: 'TaskStateEntered',
        stateEnteredEventDetails: { name: 'NotifyMatched' },
      },
      { type: 'ExecutionSucceeded' },
    ];

    const runtime = deriveWorkflowRuntime(events);

    expect(runtime.isComplete).toBe(true);
    expect(runtime.succeeded).toBe(true);
    expect(runtime.states.NotifyMatched.status).toBe('completed');
    expect(runtime.activeState).toBeNull();
  });

  it('marks MatchingFailed on ExecutionFailed', () => {
    const events: HistoryEvent[] = [
      {
        type: 'TaskStateEntered',
        stateEnteredEventDetails: { name: 'MatchingFailed' },
      },
      { type: 'ExecutionFailed' },
    ];

    const runtime = deriveWorkflowRuntime(events);

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
