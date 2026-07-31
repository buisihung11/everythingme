import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getEventBus } from '@studying/mfe-shared/event-bus';
import type { AnalyticsPoint } from '@studying/mfe-shared/types';

const chartData: AnalyticsPoint[] = [
  { month: 'Jan', users: 400, revenue: 2400, orders: 120 },
  { month: 'Feb', users: 520, revenue: 3100, orders: 145 },
  { month: 'Mar', users: 610, revenue: 3800, orders: 178 },
  { month: 'Apr', users: 720, revenue: 4200, orders: 201 },
  { month: 'May', users: 890, revenue: 5100, orders: 245 },
  { month: 'Jun', users: 1020, revenue: 6200, orders: 290 },
];

export function Analytics() {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const bus = getEventBus();
    // Payloads are validated by the bus against the shared zod schemas before
    // reaching this handler, so `event.payload` is already the correct shape.
    const unsubTrack = bus.subscribe('analytics:track', (event) => {
      setEvents((prev) => [`Tracked: ${event.payload.action} (from ${event.source})`, ...prev].slice(0, 5));
    });
    const unsubUser = bus.subscribe('user:selected', (event) => {
      setEvents((prev) => [`User selected: ${event.payload.name}`, ...prev].slice(0, 5));
    });
    const unsubProduct = bus.subscribe('product:viewed', (event) => {
      setEvents((prev) => [`Product viewed: ${event.payload.name}`, ...prev].slice(0, 5));
    });
    return () => {
      unsubTrack();
      unsubUser();
      unsubProduct();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mfe-concept-tag">React Remote</span>
        <span className="mfe-concept-tag">Event Bus Listener</span>
      </div>

      <div className="mfe-card">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="mt-1 text-sm text-admin-muted">
          Charts update from cross-remote events published on the shared event bus.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="mfe-card">
          <h3 className="mb-4 font-semibold">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Area type="monotone" dataKey="revenue" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mfe-card">
          <h3 className="mb-4 font-semibold">Monthly Orders</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Bar dataKey="orders" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mfe-card">
        <h3 className="font-semibold">Live Event Feed</h3>
        <p className="mt-1 text-sm text-admin-muted">
          Events from Dashboard, Users, and Products remotes appear here in real time.
        </p>
        <ul className="mt-4 space-y-2">
          {events.length === 0 ? (
            <li className="text-sm text-admin-muted">Waiting for cross-remote events...</li>
          ) : (
            events.map((event, i) => (
              <li key={i} className="rounded-lg border border-admin-border bg-slate-900/40 px-3 py-2 text-sm">
                {event}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default Analytics;
