import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RemoteErrorBoundary } from './components/ErrorBoundary';
import { AngularUsersHost } from './remotes/AngularUsersHost';
import { VueProductsHost } from './remotes/VueProductsHost';
import { EventBusPage } from './pages/EventBusPage';
import { getEventBus } from '@studying/mfe-shared/event-bus';

const MfeDashboard = React.lazy(() => import('mfe-dashboard/Module'));
const MfeAnalytics = React.lazy(() => import('mfe-analytics/Module'));

const concepts = [
  { title: 'Module Federation', desc: 'Webpack 5 runtime composition of independently built apps.' },
  { title: 'Host / Remote', desc: 'React shell orchestrates Angular, Vue, and React remotes.' },
  { title: 'Cross-Framework', desc: 'Different frameworks coexist in one admin experience.' },
  { title: 'Shared Singleton', desc: 'React, auth store, and event bus shared across remotes.' },
  { title: 'Dynamic Loading', desc: 'Remotes loaded at runtime via React.lazy and custom mounts.' },
  { title: 'Error Boundaries', desc: 'Graceful degradation when a remote is offline.' },
  { title: 'Event Bus', desc: 'window.__MFE_EVENT_BUS__ for cross-remote communication.' },
  { title: 'Independent Dev', desc: 'Each remote can run standalone on its own port.' },
];

function HomePage() {
  React.useEffect(() => {
    getEventBus().publish('dashboard:refresh', { source: 'shell-home' }, 'mfe-shell');
  }, []);

  return (
    <div className="space-y-6">
      <div className="mfe-card">
        <h2 className="text-2xl font-bold">Micro Frontend Admin Study App</h2>
        <p className="mt-2 text-admin-muted">
          This shell is built with React. Each sidebar module is a separate micro frontend using a
          different framework, composed at runtime with Module Federation.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {concepts.map((concept) => (
          <div key={concept.title} className="mfe-card">
            <span className="mfe-concept-tag">{concept.title}</span>
            <p className="mt-3 text-sm text-admin-muted">{concept.desc}</p>
          </div>
        ))}
      </div>
      <div className="mfe-card">
        <h3 className="font-semibold">Port Map</h3>
        <ul className="mt-3 space-y-1 text-sm text-admin-muted">
          <li>Shell (React): 4200</li>
          <li>Dashboard (React): 4201</li>
          <li>Users (Angular): 4202</li>
          <li>Products (Vue): 4203</li>
          <li>Analytics (React): 4204</li>
        </ul>
      </div>
    </div>
  );
}

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/event-bus" element={<EventBusPage />} />
        <Route
          path="/dashboard"
          element={
            <RemoteErrorBoundary remoteName="mfe_dashboard (React)">
              <MfeDashboard />
            </RemoteErrorBoundary>
          }
        />
        <Route path="/users" element={<AngularUsersHost />} />
        <Route path="/products" element={<VueProductsHost />} />
        <Route
          path="/analytics"
          element={
            <RemoteErrorBoundary remoteName="mfe_analytics (React)">
              <MfeAnalytics />
            </RemoteErrorBoundary>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
