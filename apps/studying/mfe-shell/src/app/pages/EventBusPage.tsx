import { useEffect, useMemo, useState } from 'react';
import { getAuthStore } from '@studying/mfe-shared/auth-store';
import type { AuthUser } from '@studying/mfe-shared/auth-store';
import { getEventBus, type MfeEvent } from '@studying/mfe-shared/event-bus';
import {
  eventPayloadSchemas,
  formatZodError,
  type EventPayloadMap,
  type MfeEventType,
} from '@studying/mfe-shared/event-schemas';

const EVENT_TYPES: MfeEventType[] = [
  'dashboard:refresh',
  'analytics:track',
  'user:selected',
  'product:viewed',
  'auth:changed',
  'api:event',
];

const EVENT_TYPE_STYLES: Record<MfeEventType, string> = {
  'dashboard:refresh': 'bg-sky-500/20 text-sky-200 border-sky-500/30',
  'analytics:track': 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  'user:selected': 'bg-violet-500/20 text-violet-200 border-violet-500/30',
  'product:viewed': 'bg-amber-500/20 text-amber-200 border-amber-500/30',
  'auth:changed': 'bg-rose-500/20 text-rose-200 border-rose-500/30',
  'api:event': 'bg-orange-500/20 text-orange-200 border-orange-500/30',
};

const SOURCE_STYLES: Record<string, string> = {
  'mfe-shell': 'bg-slate-500/20 text-slate-200 border-slate-500/30',
  mfe_dashboard: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  mfe_users: 'bg-red-500/20 text-red-200 border-red-500/30',
  mfe_products_vue: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
  mfe_analytics: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
};

const ROLE_USERS: Record<AuthUser['role'], AuthUser> = {
  admin: {
    id: '1',
    name: 'Admin User',
    email: 'admin@everythingme.dev',
    role: 'admin',
  },
  editor: {
    id: '2',
    name: 'Editor User',
    email: 'editor@everythingme.dev',
    role: 'editor',
  },
  viewer: {
    id: '3',
    name: 'Viewer User',
    email: 'viewer@everythingme.dev',
    role: 'viewer',
  },
};

const DEFAULT_PAYLOADS: EventPayloadMap = {
  'dashboard:refresh': { source: 'event-bus-monitor' },
  'analytics:track': { action: 'manual-track' },
  'user:selected': { id: 'demo-1', name: 'Demo User' },
  'product:viewed': { id: 'demo-p1', name: 'Demo Product' },
  'auth:changed': { action: 'role-switch' },
  'api:event': { kind: 'log:info', label: 'manual api:event' },
};

/**
 * The "Publish from Shell" panel lets a user type arbitrary JSON for a
 * runtime-selected event type, so the type can't be a compile-time literal.
 * We validate against the same zod schema the bus itself uses, then hand off
 * a payload that's already known-good — the cast only bypasses TypeScript's
 * generic-key inference, not the actual runtime safety check.
 */
function publishUnknownPayload(
  type: MfeEventType,
  rawPayload: unknown,
  source: string,
): { success: true } | { success: false; message: string } {
  const result = eventPayloadSchemas[type].safeParse(rawPayload);
  if (!result.success) {
    return { success: false, message: formatZodError(result.error) };
  }
  (getEventBus().publish as (t: MfeEventType, p: unknown, s: string) => void)(type, result.data, source);
  return { success: true };
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(timestamp).toLocaleTimeString();
}

function getSourceStyle(source: string): string {
  return SOURCE_STYLES[source] ?? 'bg-slate-500/20 text-slate-200 border-slate-500/30';
}

function getFrameworkLabel(source: string): string {
  if (source === 'mfe-shell') return 'Shell';
  if (source === 'mfe_users') return 'Angular';
  if (source === 'mfe_products_vue') return 'Vue';
  return 'React';
}

export function EventBusPage() {
  const [events, setEvents] = useState<MfeEvent[]>(() => getEventBus().getHistory());
  const [selectedType, setSelectedType] = useState<MfeEventType>('analytics:track');
  const [payloadJson, setPayloadJson] = useState(
    () => JSON.stringify(DEFAULT_PAYLOADS['analytics:track'], null, 2),
  );
  const [authState, setAuthState] = useState(() => getAuthStore().getState());
  const [payloadError, setPayloadError] = useState<string | null>(null);

  useEffect(() => {
    const bus = getEventBus();
    const unsubscribers = EVENT_TYPES.map((type) =>
      bus.subscribe(type, (event) => {
        setEvents((prev) => [event, ...prev].slice(0, 100));
      }),
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  useEffect(() => {
    const store = getAuthStore();
    return store.subscribe((state) => setAuthState(state));
  }, []);

  useEffect(() => {
    setPayloadJson(JSON.stringify(DEFAULT_PAYLOADS[selectedType], null, 2));
    setPayloadError(null);
  }, [selectedType]);

  const stats = useMemo(() => {
    return EVENT_TYPES.map((type) => {
      const typeEvents = events.filter((event) => event.type === type);
      const lastEvent = typeEvents[0];
      return {
        type,
        count: typeEvents.length,
        lastSeen: lastEvent ? formatRelativeTime(lastEvent.timestamp) : 'never',
      };
    });
  }, [events]);

  const handleClearLog = () => {
    getEventBus().clearHistory();
    setEvents([]);
  };

  const handlePublish = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadJson);
    } catch {
      setPayloadError('Invalid JSON syntax — fix it and try again.');
      return;
    }

    const result = publishUnknownPayload(selectedType, parsed, 'mfe-shell');
    setPayloadError(result.success ? null : result.message);
  };

  const handleQuickPublish = <T extends MfeEventType>(type: T, payload: EventPayloadMap[T]) => {
    getEventBus().publish(type, payload, 'mfe-shell');
  };

  const handleRoleSwitch = (role: AuthUser['role']) => {
    const user = ROLE_USERS[role];
    const token = `demo-token-${role}`;
    getAuthStore().getState().login(user, token);
    getEventBus().publish('auth:changed', { action: 'role-switch', role }, 'mfe-shell');
  };

  const handleAuthToggle = () => {
    if (authState.isAuthenticated) {
      getAuthStore().getState().logout();
      getEventBus().publish('auth:changed', { action: 'logout' }, 'mfe-shell');
      return;
    }

    const user = ROLE_USERS.admin;
    getAuthStore().getState().login(user, 'demo-token-admin');
    getEventBus().publish('auth:changed', { action: 'login' }, 'mfe-shell');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mfe-concept-tag">Event Bus</span>
        <span className="mfe-concept-tag">Shared State</span>
        <span className="mfe-concept-tag">Cross-Framework</span>
        <span className="mfe-concept-tag">Pub/Sub</span>
      </div>

      <div className="mfe-card">
        <h2 className="text-2xl font-bold">Event Bus & Shared State Monitor</h2>
        <p className="mt-1 text-sm text-admin-muted">
          Live view of cross-remote communication via <code className="text-sky-300">window.__MFE_EVENT_BUS__</code>{' '}
          and <code className="text-sky-300">window.__MFE_AUTH_STORE__</code>. Publish events from the shell,
          switch auth roles, then navigate to Users or Products remotes to see real cross-app signals.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="mfe-card xl:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Live Event Stream</h3>
              <p className="text-sm text-admin-muted">{events.length} events this session</p>
            </div>
            <button
              className="mfe-btn border border-admin-border text-slate-300 hover:bg-slate-700"
              onClick={handleClearLog}
            >
              Clear Log
            </button>
          </div>

          <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
            {events.length === 0 ? (
              <li className="rounded-lg border border-dashed border-admin-border px-4 py-8 text-center text-sm text-admin-muted">
                No events yet. Publish from the panel on the right, or visit Users / Products / Dashboard remotes.
              </li>
            ) : (
              events.map((event, index) => (
                <li
                  key={`${event.timestamp}-${event.type}-${index}`}
                  className="rounded-lg border border-admin-border bg-slate-900/40 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${EVENT_TYPE_STYLES[event.type]}`}
                    >
                      {event.type}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getSourceStyle(event.source)}`}
                    >
                      {event.source}
                    </span>
                    <span className="text-xs text-admin-muted">{getFrameworkLabel(event.source)}</span>
                    <span className="ml-auto text-xs text-admin-muted">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  <pre className="mt-2 overflow-x-auto rounded bg-slate-950/60 p-2 text-xs text-slate-300">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="mfe-card">
            <h3 className="font-semibold">Publish Event</h3>
            <p className="mt-1 text-sm text-admin-muted">
              Simulate remote activity from the shell host. Payloads are validated with{' '}
              <code className="text-sky-300">zod</code> against the same schema the bus enforces for
              every remote — try breaking the JSON to see it rejected.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-admin-muted">Event type</span>
                <select
                  className="mt-1 w-full rounded-lg border border-admin-border bg-slate-900 px-3 py-2 text-sm"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as MfeEventType)}
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-admin-muted">Payload (JSON)</span>
                  <button
                    type="button"
                    className="text-xs text-rose-300 underline decoration-dotted hover:text-rose-200"
                    onClick={() => {
                      setPayloadJson(JSON.stringify({ wrong: 'shape' }, null, 2));
                      setPayloadError(null);
                    }}
                  >
                    Try invalid payload
                  </button>
                </div>
                <textarea
                  className={`mt-1 h-28 w-full rounded-lg border bg-slate-900 px-3 py-2 font-mono text-xs ${
                    payloadError ? 'border-rose-500/60' : 'border-admin-border'
                  }`}
                  value={payloadJson}
                  onChange={(e) => {
                    setPayloadJson(e.target.value);
                    if (payloadError) setPayloadError(null);
                  }}
                  aria-invalid={payloadError ? 'true' : 'false'}
                />
                {payloadError && <p className="mt-1 text-xs text-rose-400">{payloadError}</p>}
              </label>

              <button className="mfe-btn-primary w-full" onClick={handlePublish}>
                Publish from Shell
              </button>
            </div>

            <div className="mt-4 border-t border-admin-border pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-admin-muted">
                Quick Fire
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="mfe-btn border border-admin-border text-xs text-slate-300 hover:bg-slate-700"
                  onClick={() =>
                    handleQuickPublish('user:selected', { id: 'qf-1', name: 'Quick User' })
                  }
                >
                  Simulate User Select
                </button>
                <button
                  className="mfe-btn border border-admin-border text-xs text-slate-300 hover:bg-slate-700"
                  onClick={() =>
                    handleQuickPublish('product:viewed', { id: 'qf-p1', name: 'Quick Product' })
                  }
                >
                  Simulate Product View
                </button>
                <button
                  className="mfe-btn border border-admin-border text-xs text-slate-300 hover:bg-slate-700"
                  onClick={() =>
                    handleQuickPublish('dashboard:refresh', { source: 'event-bus-monitor' })
                  }
                >
                  Trigger Dashboard Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="mfe-card">
            <h3 className="font-semibold">Auth State Inspector</h3>
            <p className="mt-1 text-sm text-admin-muted">
              Shared Zustand store on <code className="text-sky-300">window.__MFE_AUTH_STORE__</code>
            </p>

            <div className="mt-4 rounded-lg border border-admin-border bg-slate-900/40 p-4">
              {authState.isAuthenticated && authState.user ? (
                <>
                  <p className="font-medium">{authState.user.name}</p>
                  <p className="text-sm text-admin-muted">{authState.user.email}</p>
                  <span className="mt-2 inline-block rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-200">
                    {authState.user.role}
                  </span>
                </>
              ) : (
                <p className="text-sm text-admin-muted">Not authenticated</p>
              )}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-admin-muted">
                Switch Role
              </p>
              <div className="flex flex-wrap gap-2">
                {(['admin', 'editor', 'viewer'] as const).map((role) => (
                  <button
                    key={role}
                    className={`mfe-btn border text-xs capitalize ${
                      authState.user?.role === role
                        ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                        : 'border-admin-border text-slate-300 hover:bg-slate-700'
                    }`}
                    onClick={() => handleRoleSwitch(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="mfe-btn mt-4 w-full border border-admin-border text-slate-300 hover:bg-slate-700"
              onClick={handleAuthToggle}
            >
              {authState.isAuthenticated ? 'Logout' : 'Login as Admin'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.type} className="mfe-card">
            <span
              className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${EVENT_TYPE_STYLES[stat.type]}`}
            >
              {stat.type}
            </span>
            <p className="mt-3 text-2xl font-bold text-sky-300">{stat.count}</p>
            <p className="mt-1 text-xs text-admin-muted">Last seen: {stat.lastSeen}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventBusPage;
