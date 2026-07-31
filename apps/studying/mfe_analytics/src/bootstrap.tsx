import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import Analytics from './app/Analytics';
import './styles.css';
import { getEventBus } from '@studying/mfe-shared/event-bus';

getEventBus();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <div className="min-h-screen bg-admin-bg p-6">
      <Analytics />
    </div>
  </StrictMode>
);
