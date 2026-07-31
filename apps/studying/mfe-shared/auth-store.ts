import { createStore } from 'zustand/vanilla';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

declare global {
  interface Window {
    __MFE_AUTH_STORE__?: ReturnType<typeof createAuthStore>;
  }
}

function createAuthStore() {
  return createStore<AuthState>((set) => ({
    token: 'demo-token-abc123',
    user: {
      id: '1',
      name: 'Admin User',
      email: 'admin@everythingme.dev',
      role: 'admin',
    },
    isAuthenticated: true,
    login: (user, token) => set({ user, token, isAuthenticated: true }),
    logout: () => set({ user: null, token: null, isAuthenticated: false }),
  }));
}

export function getAuthStore() {
  if (window.__MFE_AUTH_STORE__) {
    return window.__MFE_AUTH_STORE__;
  }
  // Freeze the store API and lock the window property so no remote can
  // reassign the singleton or overwrite login/logout with a rogue implementation.
  const store = Object.freeze(createAuthStore());
  Object.defineProperty(window, '__MFE_AUTH_STORE__', {
    value: store,
    writable: false,
    configurable: false,
    enumerable: true,
  });
  return store;
}
