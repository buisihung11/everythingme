import { beforeEach, describe, expect, it } from 'vitest';
import { getAuthStore } from './auth-store';

const demoUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@everythingme.dev',
  role: 'admin' as const,
};

describe('getAuthStore singleton', () => {
  it('returns the same frozen singleton on repeated calls', () => {
    const first = getAuthStore();
    const second = getAuthStore();

    expect(second).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
  });
});

describe('AuthState', () => {
  const store = getAuthStore();

  beforeEach(() => {
    store.getState().login(demoUser, 'demo-token-abc123');
  });

  it('starts authenticated with the demo admin user', () => {
    const state = store.getState();

    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(demoUser);
    expect(state.token).toBe('demo-token-abc123');
  });

  it('login replaces the current session', () => {
    const user = {
      id: '7',
      name: 'Editor User',
      email: 'editor@everythingme.dev',
      role: 'editor' as const,
    };

    store.getState().login(user, 'editor-token');

    expect(store.getState()).toMatchObject({
      isAuthenticated: true,
      token: 'editor-token',
      user,
    });
  });

  it('logout clears authentication state', () => {
    store.getState().logout();

    expect(store.getState()).toMatchObject({
      isAuthenticated: false,
      token: null,
      user: null,
    });
  });
});
