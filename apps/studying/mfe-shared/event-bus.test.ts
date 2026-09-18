import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEventBus } from './event-bus';

describe('getEventBus singleton', () => {
  it('returns the same frozen singleton on repeated calls', () => {
    const first = getEventBus();
    const second = getEventBus();

    expect(second).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it('locks the window property so remotes cannot replace the bus', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, '__MFE_EVENT_BUS__');
    expect(descriptor?.writable).toBe(false);
    expect(descriptor?.configurable).toBe(false);
  });
});

describe('MfeEventBus publish/subscribe', () => {
  const bus = getEventBus();
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    bus.clearHistory();
  });

  it('delivers validated events to subscribers', () => {
    const handler = vi.fn();
    cleanups.push(bus.subscribe('user:selected', handler));

    bus.publish('user:selected', { id: '42', name: 'Ada' }, 'test');

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({
      type: 'user:selected',
      payload: { id: '42', name: 'Ada' },
      source: 'test',
    });
  });

  it('rejects invalid payloads and does not notify subscribers', () => {
    const handler = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    cleanups.push(bus.subscribe('user:selected', handler));

    bus.publish('user:selected', { id: 123, name: 'Ada' } as never, 'test');

    expect(handler).not.toHaveBeenCalled();
    expect(bus.getHistory()).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('isolates subscriber failures so other handlers still run', () => {
    const failing = vi.fn(() => {
      throw new Error('subscriber blew up');
    });
    const healthy = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    cleanups.push(bus.subscribe('api:event', failing));
    cleanups.push(bus.subscribe('api:event', healthy));

    bus.publish(
      'api:event',
      { kind: 'log:info', label: 'start' },
      'test',
    );

    expect(failing).toHaveBeenCalledOnce();
    expect(healthy).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });

  it('unsubscribe stops delivery', () => {
    const handler = vi.fn();
    const unsub = bus.subscribe('auth:changed', handler);
    unsub();

    bus.publish('auth:changed', { action: 'logout' }, 'test');

    expect(handler).not.toHaveBeenCalled();
  });

  it('caps history at 200 events', () => {
    for (let i = 0; i < 205; i++) {
      bus.publish('analytics:track', { action: `click-${i}` }, 'test');
    }

    expect(bus.getHistory()).toHaveLength(200);
    expect(bus.getHistory()[0].payload).toEqual({ action: 'click-5' });
  });

  it('getHistory returns a copy that does not mutate internal state', () => {
    bus.publish('dashboard:refresh', { source: 'shell' }, 'test');

    const snapshot = bus.getHistory();
    snapshot.pop();

    expect(bus.getHistory()).toHaveLength(1);
  });

  it('clearHistory removes all stored events', () => {
    bus.publish('dashboard:refresh', { source: 'shell' }, 'test');
    bus.clearHistory();

    expect(bus.getHistory()).toHaveLength(0);
  });
});
