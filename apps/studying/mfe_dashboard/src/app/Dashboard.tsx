import { useEffect, useState } from 'react';
import { getEventBus } from '@studying/mfe-shared/event-bus';
import { getAuthStore } from '@studying/mfe-shared/auth-store';
import type { ActivityItem, DashboardStats } from '@studying/mfe-shared/types';

const stats: DashboardStats = {
  totalUsers: 1284,
  totalProducts: 342,
  revenue: 89420,
  activeSessions: 87,
};

const activities: ActivityItem[] = [
  { id: '1', message: 'New user registered: alice@example.com', time: '2 min ago', type: 'success' },
  { id: '2', message: 'Product "Wireless Mouse" stock low', time: '15 min ago', type: 'warning' },
  { id: '3', message: 'Dashboard refreshed from shell', time: 'Just now', type: 'info' },
  { id: '4', message: 'Order #4821 completed — $129.00', time: '1 hour ago', type: 'success' },
];

const statCards = [
  { label: 'Total Users', value: stats.totalUsers, key: 'totalUsers' as const },
  { label: 'Products', value: stats.totalProducts, key: 'totalProducts' as const },
  { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, key: 'revenue' as const },
  { label: 'Active Sessions', value: stats.activeSessions, key: 'activeSessions' as const },
];

export function Dashboard() {
  const [feed, setFeed] = useState(activities);
  const [lastSelectedUser, setLastSelectedUser] = useState<string | null>(null);
  const [receivedEventCount, setReceivedEventCount] = useState(0);
  const auth = getAuthStore().getState();

  useEffect(() => {
    const bus = getEventBus();
    const unsubscribeRefresh = bus.subscribe('dashboard:refresh', (event) => {
      setReceivedEventCount((count) => count + 1);
      setFeed((prev) =>
        [
          {
            id: String(Date.now()),
            message: `Refresh event from ${event.source}`,
            time: 'Just now',
            type: 'info' as const,
          },
          ...prev,
        ].slice(0, 8),
      );
    });
    const unsubscribeUser = bus.subscribe('user:selected', (event) => {
      setReceivedEventCount((count) => count + 1);
      setLastSelectedUser(event.payload.name);
    });
    return () => {
      unsubscribeRefresh();
      unsubscribeUser();
    };
  }, []);

  const handleQuickAction = (action: string) => {
    getEventBus().publish('analytics:track', { action }, 'mfe_dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mfe-concept-tag">React Remote</span>
        <span className="mfe-concept-tag">Module Federation</span>
        <span className="mfe-concept-tag">Event Bus Subscriber</span>
      </div>

      <div className="mfe-card">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="mt-1 text-sm text-admin-muted">
          Welcome back, {auth.user?.name}. This module is a React remote loaded by the shell.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.key} className="mfe-card">
            <p className="text-sm text-admin-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-sky-300">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="mfe-card">
          <h3 className="font-semibold">Activity Feed</h3>
          <ul className="mt-4 space-y-3">
            {feed.map((item) => (
              <li key={item.id} className="rounded-lg border border-admin-border bg-slate-900/40 p-3">
                <p className="text-sm">{item.message}</p>
                <p className="mt-1 text-xs text-admin-muted">{item.time}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mfe-card">
          <h3 className="font-semibold">Quick Actions</h3>
          <p className="mt-1 text-sm text-admin-muted">
            Each action publishes <code className="text-sky-300">analytics:track</code> to the shared
            event bus — open Analytics or Event Bus to see it arrive.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {['Export Report', 'Sync Data', 'Notify Team'].map((action) => (
              <button
                key={action}
                className="mfe-btn-primary"
                onClick={() => handleQuickAction(action)}
                title={`Publishes analytics:track with action "${action}"`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="mfe-card">
          <h3 className="font-semibold">Cross-Remote Signals</h3>
          <p className="mt-1 text-sm text-admin-muted">
            Events received on this remote since mount. Select a user in the Angular Users module to
            see <code className="text-sky-300">user:selected</code> appear here.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between rounded-lg border border-admin-border bg-slate-900/40 px-3 py-2">
              <dt className="text-admin-muted">Events received</dt>
              <dd className="font-medium text-sky-300">{receivedEventCount}</dd>
            </div>
            <div className="flex justify-between rounded-lg border border-admin-border bg-slate-900/40 px-3 py-2">
              <dt className="text-admin-muted">Last user selected</dt>
              <dd className="font-medium">{lastSelectedUser ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
