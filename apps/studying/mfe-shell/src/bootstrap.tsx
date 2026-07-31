import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';
import './styles.css';
import { getAuthStore } from '@studying/mfe-shared/auth-store';
import { getEventBus } from '@studying/mfe-shared/event-bus';

// Initialize shared singletons before any remote loads
getEventBus();
getAuthStore();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
