import { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import {
  createApiClient,
  retry,
  timeout,
  telemetry,
  logging,
  errorNormalization,
  ApiError,
  ApiValidationError,
  ApiTimeoutError,
} from '@everythingme/api';
import type { ApiSpan, ApiTracer, ApiLogger } from '@everythingme/api';
import { mockTransport } from '@studying/mfe-shared/api/transport';
import { getEventBus } from '@studying/mfe-shared/event-bus';
import type { MfeEvent } from '@studying/mfe-shared/event-bus';

// ---------------------------------------------------------------------------
// Middleware pipeline stages (for the visual diagram)
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = [
  { id: 'telemetry', label: 'telemetry', color: 'bg-purple-500/20 border-purple-400/40 text-purple-200' },
  { id: 'logging', label: 'logging', color: 'bg-blue-500/20 border-blue-400/40 text-blue-200' },
  { id: 'errorNorm', label: 'errorNormalization', color: 'bg-yellow-500/20 border-yellow-400/40 text-yellow-200' },
  { id: 'validate', label: 'validate(schema)', color: 'bg-green-500/20 border-green-400/40 text-green-200' },
  { id: 'retry', label: 'retry(3)', color: 'bg-orange-500/20 border-orange-400/40 text-orange-200' },
  { id: 'timeout', label: 'timeout(1500ms)', color: 'bg-red-500/20 border-red-400/40 text-red-200' },
  { id: 'handler', label: 'handler', color: 'bg-sky-500/20 border-sky-400/40 text-sky-200' },
];

// ---------------------------------------------------------------------------
// Log entry type for the live timeline
// ---------------------------------------------------------------------------

interface LogEntry {
  id: number;
  timestamp: number;
  kind: string;
  label: string;
  durationMs?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Build a demo action with event-bus-connected telemetry + logging
// ---------------------------------------------------------------------------

function buildDemoAction(addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void) {
  const tracer: ApiTracer = {
    startSpan(name: string): ApiSpan {
      addLog({ kind: 'span:start', label: name });
      const start = Date.now();
      return {
        setStatus() {},
        recordException() {},
        end() {
          addLog({ kind: 'span:end', label: name, durationMs: Date.now() - start });
        },
      };
    },
  };

  const logger: ApiLogger = {
    info(message, data) {
      addLog({ kind: 'log:info', label: message, durationMs: data?.durationMs as number | undefined });
    },
    error(message, data) {
      addLog({ kind: 'log:error', label: message, error: data?.message as string | undefined });
    },
  };

  const inputSchema = z.object({
    scenario: z.enum(['success', 'validation-fail', 'retry-succeed', 'timeout']),
  });

  return createApiClient()
    .use(telemetry({ tracer }))
    .use(logging({ logger }))
    .use(errorNormalization())
    .input(inputSchema)
    .use(retry({ attempts: 3, delayMs: 50 }))
    .use(timeout({ ms: 1500 }))
    .handler(async ({ input, ctx }) => {
      const { scenario } = input;
      if (scenario === 'timeout') {
        mockTransport.setHang(true);
        try {
          return await mockTransport.get<string>('/stats', { signal: ctx.signal });
        } finally {
          mockTransport.setHang(false);
        }
      }
      if (scenario === 'retry-succeed') {
        mockTransport.setFlakiness(0.7);
        try {
          const result = await mockTransport.get<string>('/stats', { signal: ctx.signal });
          return result;
        } finally {
          mockTransport.setFlakiness(0);
        }
      }
      mockTransport.setFlakiness(0);
      mockTransport.setHang(false);
      return mockTransport.get<string>('/stats', { signal: ctx.signal });
    });
}

// ---------------------------------------------------------------------------
// Scenario buttons config
// ---------------------------------------------------------------------------

const SCENARIOS = [
  { id: 'success', label: 'Success', desc: 'Normal happy path — 400 ms mock latency' },
  {
    id: 'validation-fail',
    label: 'Validation Failure',
    desc: 'Passes an invalid input — validate middleware rejects it instantly',
  },
  {
    id: 'retry-succeed',
    label: 'Retry → Succeed',
    desc: '70% flakiness — retry middleware loops until it works',
  },
  {
    id: 'timeout',
    label: 'Timeout',
    desc: 'Handler hangs — timeout middleware fires ApiTimeoutError after 1.5 s',
  },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApiPipelinePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [busEvents, setBusEvents] = useState<MfeEvent[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [running, setRunning] = useState(false);
  const counterRef = useRef(0);

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    counterRef.current += 1;
    setLogs((prev) => [...prev, { ...entry, id: counterRef.current, timestamp: Date.now() }].slice(-30));
  };

  useEffect(() => {
    const bus = getEventBus();
    const unsub = bus.subscribe('api:event', (event) => {
      setBusEvents((prev) => [event, ...prev].slice(0, 20));
    });
    return unsub;
  }, []);

  const runScenario = async (scenarioId: string) => {
    if (running) return;
    setRunning(true);
    setActiveScenario(scenarioId);
    setResult(null);
    setLogs([]);

    const action = buildDemoAction(addLog);

    try {
      const input = scenarioId === 'validation-fail'
        ? ({ scenario: 'INVALID' } as never)
        : { scenario: scenarioId as 'success' | 'retry-succeed' | 'timeout' };
      const data = await action(input);
      setResult({ ok: true, message: `Success: ${JSON.stringify(data).slice(0, 80)}` });
    } catch (err) {
      let message = String(err);
      if (err instanceof ApiTimeoutError) message = `ApiTimeoutError: ${err.message}`;
      else if (err instanceof ApiValidationError) message = `ApiValidationError: ${err.message}`;
      else if (err instanceof ApiError) message = `ApiError: ${err.message}`;
      setResult({ ok: false, message });
    } finally {
      setRunning(false);
    }
  };

  const kindColor: Record<string, string> = {
    'span:start': 'text-purple-300',
    'span:end': 'text-purple-400',
    'log:info': 'text-blue-300',
    'log:error': 'text-red-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mfe-concept-tag">@everythingme/api</span>
        <span className="mfe-concept-tag">Middleware Pipeline</span>
        <span className="mfe-concept-tag">Live Demo</span>
      </div>

      <div className="mfe-card">
        <h2 className="text-2xl font-bold">API Pipeline Visualiser</h2>
        <p className="mt-1 text-sm text-admin-muted">
          Each button runs a real invocation through the full middleware stack.
          Telemetry and logging publish to{' '}
          <code className="text-sky-300">__MFE_EVENT_BUS__</code> — watch the timeline below.
        </p>
      </div>

      {/* Pipeline diagram */}
      <div className="mfe-card">
        <h3 className="mb-4 font-semibold">Pipeline (outermost → handler)</h3>
        <div className="flex flex-wrap items-center gap-2">
          {PIPELINE_STAGES.map((stage, idx) => (
            <div key={stage.id} className="flex items-center gap-2">
              <div className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${stage.color}`}>
                {stage.label}
              </div>
              {idx < PIPELINE_STAGES.length - 1 && (
                <span className="text-admin-muted">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scenario buttons */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => runScenario(scenario.id)}
            disabled={running}
            className={`mfe-card cursor-pointer text-left transition-all ${
              activeScenario === scenario.id
                ? 'ring-2 ring-sky-400'
                : 'hover:ring-1 hover:ring-slate-500'
            } ${running && activeScenario !== scenario.id ? 'opacity-50' : ''}`}
          >
            <p className="font-semibold text-sm">
              {running && activeScenario === scenario.id && (
                <span className="mr-2 inline-block animate-spin">⟳</span>
              )}
              {scenario.label}
            </p>
            <p className="mt-1 text-xs text-admin-muted">{scenario.desc}</p>
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div
          className={`mfe-card border ${
            result.ok ? 'border-green-400/40 bg-green-500/10' : 'border-red-400/40 bg-red-500/10'
          }`}
        >
          <p className={`text-sm font-medium ${result.ok ? 'text-green-300' : 'text-red-300'}`}>
            {result.ok ? '✓ ' : '✕ '}{result.message}
          </p>
        </div>
      )}

      {/* Live middleware timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="mfe-card">
          <h3 className="mb-3 font-semibold">
            Middleware Timeline
            <span className="ml-2 text-xs text-admin-muted font-normal">
              (this invocation)
            </span>
          </h3>
          {logs.length === 0 ? (
            <p className="text-sm text-admin-muted">Run a scenario to see events.</p>
          ) : (
            <ul className="space-y-1.5 font-mono text-xs">
              {logs.map((log) => (
                <li key={log.id} className="flex items-baseline gap-2">
                  <span className="shrink-0 text-admin-muted">
                    +{((log.timestamp - logs[0].timestamp) / 1).toFixed(0)}ms
                  </span>
                  <span className={kindColor[log.kind] ?? 'text-slate-300'}>
                    [{log.kind}]
                  </span>
                  <span className="text-slate-200 truncate">{log.label}</span>
                  {log.durationMs !== undefined && (
                    <span className="text-admin-muted">({log.durationMs}ms)</span>
                  )}
                  {log.error && (
                    <span className="text-red-400 truncate">{log.error}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bus events */}
        <div className="mfe-card">
          <h3 className="mb-3 font-semibold">
            Event Bus — <code className="text-sky-300">api:event</code>
            <span className="ml-2 text-xs text-admin-muted font-normal">
              (cross-remote visibility)
            </span>
          </h3>
          {busEvents.length === 0 ? (
            <p className="text-sm text-admin-muted">No api:event published yet.</p>
          ) : (
            <ul className="space-y-1.5 font-mono text-xs">
              {busEvents.map((ev, i) => {
                const p = ev.payload as {
                  kind: string;
                  label: string;
                  durationMs?: number;
                };
                return (
                  <li key={i} className="flex items-baseline gap-2">
                    <span className={kindColor[p.kind] ?? 'text-slate-300'}>
                      [{p.kind}]
                    </span>
                    <span className="text-slate-200 truncate">{p.label}</span>
                    {p.durationMs !== undefined && (
                      <span className="text-admin-muted">({p.durationMs}ms)</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApiPipelinePage;
