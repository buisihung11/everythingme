import type { Edge, Node } from '@xyflow/react';

export type WorkflowStateName =
  | 'FetchCandidates'
  | 'InitCursor'
  | 'HasMoreDrivers'
  | 'SelectDriver'
  | 'OfferToDriver'
  | 'AdvanceCursor'
  | 'NotifyMatched'
  | 'NotifyNoDrivers'
  | 'MatchingFailed';

export type WorkflowStateKind = 'task' | 'pass' | 'choice' | 'fail';

export interface StateTransition {
  when: string;
  to: string;
}

export interface WorkflowStateMeta {
  kind: WorkflowStateKind;
  description: string;
  /** ASL comment for this state. */
  comment: string;
  transitions: StateTransition[];
  /** Retry, timeout, result path, and other ASL fields. */
  details: string[];
}

export const WORKFLOW_STATE_META: Record<WorkflowStateName, WorkflowStateMeta> =
  {
    FetchCandidates: {
      kind: 'task',
      description: 'Query Location Service for nearby drivers',
      comment:
        'Activity worker calls Location Service and returns nearby available driver ids.',
      transitions: [{ when: 'Success', to: 'InitCursor' }],
      details: [
        'ResultPath $.candidates',
        'Retry TaskFailed / HeartbeatTimeout ×3 (2s, backoff 2)',
      ],
    },
    InitCursor: {
      kind: 'pass',
      description: 'Reset driver index to 0',
      comment: 'Pass state. Writes { index: 0 } onto $.cursor. No worker.',
      transitions: [{ when: 'Next', to: 'HasMoreDrivers' }],
      details: ['Result { index: 0 }', 'ResultPath $.cursor'],
    },
    HasMoreDrivers: {
      kind: 'choice',
      description: 'More drivers in the candidate list?',
      comment: 'Choice on whether the cursor is still inside the candidate list.',
      transitions: [
        { when: 'cursor.index < candidates.count', to: 'SelectDriver' },
        { when: 'Otherwise', to: 'NotifyNoDrivers' },
      ],
      details: ['Variable $.cursor.index', 'NumericLessThanPath $.candidates.count'],
    },
    SelectDriver: {
      kind: 'pass',
      description: 'Pick driver at current index',
      comment:
        'Pass state. Picks candidates.driverIds[cursor.index] with States.ArrayGetItem.',
      transitions: [{ when: 'Next', to: 'OfferToDriver' }],
      details: ['Sets $.currentDriverId from the candidate array'],
    },
    OfferToDriver: {
      kind: 'task',
      description: 'Offer the ride and wait for a response',
      comment:
        'Activity holds the task token until the driver accepts, declines, or the offer times out. Ride Service takes a Redis lock for this driver for the whole wait.',
      transitions: [
        { when: 'Accept', to: 'NotifyMatched' },
        { when: 'Timeout, decline, or DriverLocked', to: 'AdvanceCursor' },
      ],
      details: [
        'TimeoutSeconds 15',
        'HeartbeatSeconds 60',
        'Catch States.Timeout, DriverDeclined, DriverLocked',
        'ResultPath $.offerResult',
      ],
    },
    AdvanceCursor: {
      kind: 'pass',
      description: 'Move to next driver',
      comment: 'Pass state. Increments $.cursor.index with States.MathAdd.',
      transitions: [{ when: 'Next', to: 'HasMoreDrivers' }],
      details: ['cursor.index = cursor.index + 1'],
    },
    NotifyMatched: {
      kind: 'task',
      description: 'Update Ride Service with matched driver',
      comment:
        'Activity calls Ride Service /internal/rides/:id/matched and extends the driver lock.',
      transitions: [{ when: 'Success', to: 'End' }],
      details: [
        'Input rideId, currentDriverId',
        'Retry TaskFailed ×3 (1s, backoff 2)',
      ],
    },
    NotifyNoDrivers: {
      kind: 'task',
      description: 'Mark ride as no drivers available',
      comment: 'Activity calls Ride Service /internal/rides/:id/no-drivers.',
      transitions: [{ when: 'Success', to: 'MatchingFailed' }],
      details: ['Retry TaskFailed ×3 (1s, backoff 2)'],
    },
    MatchingFailed: {
      kind: 'fail',
      description: 'Workflow failed — no match',
      comment: 'Terminal failure after every nearby driver was skipped or declined.',
      transitions: [],
      details: [
        'Error NoDriversAvailable',
        'Cause: all nearby drivers declined, timed out, or were locked',
      ],
    },
  };

export const WORKFLOW_STATE_NAMES = Object.keys(
  WORKFLOW_STATE_META,
) as WorkflowStateName[];

/** Graph coordinates only; every other node property is derived from the meta. */
const NODE_POSITIONS: Record<WorkflowStateName, { x: number; y: number }> = {
  FetchCandidates: { x: 0, y: 140 },
  InitCursor: { x: 210, y: 140 },
  HasMoreDrivers: { x: 420, y: 140 },
  SelectDriver: { x: 630, y: 20 },
  OfferToDriver: { x: 630, y: -110 },
  NotifyMatched: { x: 420, y: -110 },
  AdvanceCursor: { x: 630, y: 280 },
  NotifyNoDrivers: { x: 420, y: 300 },
  MatchingFailed: { x: 210, y: 300 },
};

export interface WorkflowNodeData extends Record<string, unknown> {
  label: WorkflowStateName;
}

export const WORKFLOW_NODES: Node<WorkflowNodeData>[] = (
  Object.keys(NODE_POSITIONS) as WorkflowStateName[]
).map((name) => ({
  id: name,
  type: 'stateNode',
  position: NODE_POSITIONS[name],
  data: { label: name },
}));

/** Edge taken when a driver declines or the offer times out. */
export const CATCH_EDGE_ID = 'e-offer-advance';
/** Edge that loops back to try the next candidate driver. */
export const LOOP_EDGE_ID = 'e-advance-has';

export const WORKFLOW_EDGES: Edge[] = [
  { id: 'e-fetch-init', source: 'FetchCandidates', target: 'InitCursor' },
  { id: 'e-init-has', source: 'InitCursor', target: 'HasMoreDrivers' },
  {
    id: 'e-has-select',
    source: 'HasMoreDrivers',
    target: 'SelectDriver',
    label: 'yes',
  },
  {
    id: 'e-has-nodrivers',
    source: 'HasMoreDrivers',
    target: 'NotifyNoDrivers',
    label: 'no',
  },
  { id: 'e-select-offer', source: 'SelectDriver', target: 'OfferToDriver' },
  {
    id: 'e-offer-matched',
    source: 'OfferToDriver',
    target: 'NotifyMatched',
    label: 'accept',
  },
  {
    id: CATCH_EDGE_ID,
    source: 'OfferToDriver',
    target: 'AdvanceCursor',
    label: 'timeout / decline',
    style: { stroke: '#f97316' },
  },
  {
    id: LOOP_EDGE_ID,
    source: 'AdvanceCursor',
    target: 'HasMoreDrivers',
    type: 'smoothstep',
  },
  {
    id: 'e-nodrivers-fail',
    source: 'NotifyNoDrivers',
    target: 'MatchingFailed',
  },
];
