import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Badge, cn } from '@everythingme/ui';
import {
  CATCH_EDGE_ID,
  LOOP_EDGE_ID,
  WORKFLOW_EDGES,
  WORKFLOW_NODES,
  WORKFLOW_STATE_META,
  type WorkflowNodeData,
  type WorkflowStateKind,
  type WorkflowStateName,
} from '../lib/workflow-definition';
import type { StateStatus, WorkflowRuntime } from '../lib/workflow-status';

type StateNodeData = WorkflowNodeData & {
  status: StateStatus;
  visits: number;
  isActive: boolean;
};

const KIND_LABELS: Record<WorkflowStateKind, string> = {
  task: 'Task',
  pass: 'Pass',
  choice: 'Choice',
  fail: 'Fail',
};

const STATUS_STYLES: Record<StateStatus, string> = {
  idle: 'border-border bg-card text-muted-foreground',
  active: 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-600/20 shadow-md',
  completed: 'border-green-600/50 bg-green-50 text-green-950',
  error: 'border-amber-600/60 bg-amber-50 text-amber-950',
};

function StateNode({ data, selected }: NodeProps<Node<StateNodeData>>) {
  const meta = WORKFLOW_STATE_META[data.label];

  return (
    <div
      className={cn(
        'min-w-[156px] cursor-grab rounded-lg border px-3 py-2.5 shadow-xs transition-colors duration-300 active:cursor-grabbing',
        STATUS_STYLES[data.status],
        data.isActive && 'scale-105',
        selected && 'ring-2 ring-foreground/50',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold leading-tight">{data.label}</span>
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {KIND_LABELS[meta.kind]}
        </Badge>
      </div>
      <p className="text-xs leading-snug opacity-80">{meta.description}</p>
      {data.visits > 1 && (
        <Badge variant="secondary" className="mt-1.5 text-[10px]">
          ×{data.visits} visits
        </Badge>
      )}
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  );
}

const nodeTypes = { stateNode: StateNode };

const STATUS_LABELS: Record<StateStatus, string> = {
  idle: 'Idle',
  active: 'Active',
  completed: 'Completed',
  error: 'Caught',
};

function withRuntime(
  node: Node<WorkflowNodeData>,
  runtime: WorkflowRuntime,
): Node<StateNodeData> {
  const name = node.id as WorkflowStateName;
  const state = runtime.states[name];
  return {
    ...node,
    data: {
      label: name,
      status: state.status,
      visits: state.visits,
      isActive: runtime.activeState === name,
    },
  };
}

interface Props {
  runtime: WorkflowRuntime;
}

export function WorkflowGraph({ runtime }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    WORKFLOW_NODES.map((node) => withRuntime(node, runtime)),
  );
  const [selectedId, setSelectedId] = useState<WorkflowStateName | null>(null);
  const skipStatusSync = useRef(true);

  // Patch live status onto the nodes React Flow already measured.
  // Replacing them on the first paint clears width/height and leaves them hidden.
  useEffect(() => {
    if (skipStatusSync.current) {
      skipStatusSync.current = false;
      return;
    }
    setNodes((current) =>
      current.map((node) => {
        const next = withRuntime(node, runtime);
        if (
          node.data.status === next.data.status &&
          node.data.visits === next.data.visits &&
          node.data.isActive === next.data.isActive
        ) {
          return node;
        }
        return { ...node, data: next.data };
      }),
    );
  }, [runtime, setNodes]);

  const edges = useMemo(
    () =>
      WORKFLOW_EDGES.map((edge) => {
        // Highlight the retry loop once the workflow has actually taken it.
        const isActivePath =
          (edge.id === CATCH_EDGE_ID && runtime.catchCount > 0) ||
          (edge.id === LOOP_EDGE_ID &&
            runtime.states.AdvanceCursor.visits > 0);

        return {
          ...edge,
          animated: isActivePath || edge.target === runtime.activeState,
          style: {
            ...edge.style,
            strokeWidth: isActivePath ? 2.5 : 1.5,
            opacity: runtime.isComplete && !isActivePath ? 0.5 : 1,
          },
        };
      }),
    [runtime],
  );

  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => {
    setSelectedId(node.id as WorkflowStateName);
  }, []);

  const selected = selectedId ? runtime.states[selectedId] : null;
  const selectedMeta = selectedId ? WORKFLOW_STATE_META[selectedId] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="min-h-0 w-full flex-1 overflow-hidden rounded-lg border bg-muted/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedId(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          panOnScroll
          zoomOnScroll
          minZoom={0.4}
          maxZoom={1.5}
          aria-label="Ride matching Step Functions state graph"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {selectedId && selected && selectedMeta ? (
        <div className="rounded-lg border bg-card px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{selectedId}</h3>
            <Badge variant="outline" className="font-normal">
              {KIND_LABELS[selectedMeta.kind]}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {STATUS_LABELS[selected.status]}
              {selected.visits > 0 ? ` · ${selected.visits} visit${selected.visits === 1 ? '' : 's'}` : ''}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {selectedMeta.comment}
          </p>
          {selectedMeta.transitions.length > 0 && (
            <dl className="mt-3 space-y-1.5">
              {selectedMeta.transitions.map((transition) => (
                <div key={`${transition.when}-${transition.to}`} className="flex gap-2 text-xs">
                  <dt className="w-44 shrink-0 text-muted-foreground">{transition.when}</dt>
                  <dd className="font-medium">{transition.to}</dd>
                </div>
              ))}
            </dl>
          )}
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {selectedMeta.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Drag a state to rearrange the graph. Click one to see its definition and live status.
        </p>
      )}
    </div>
  );
}
