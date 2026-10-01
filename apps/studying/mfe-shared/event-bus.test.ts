import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getEventBus } from './event-bus';

describe('getEventBus', () => {
  beforeEach(() => {
    getEventBus().clearHistory();
  });

  it('returns a frozen singleton locked on window', () => {
    const bus1 = getEventBus();
    const bus2 = getEventBus();

    expect(bus2).toBe(bus1);
    expect(Object.isFrozen(bus1)).toBe(true);
    expect(window.__MFE_EVENT_BUS__).toBe(bus1);
  });

  it('delivers valid payloads to subscribers and records history', () => {
    const bus = getEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('dashboard:refresh', handler);

    bus.publish('dashboard:refresh', { source: 'test-suite' }, 'unit-test');

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({
      type: 'dashboard:refresh',
      payload: { source: 'test-suite' },
      source: 'unit-test',
    });
    expect(bus.getHistory()).toHaveLength(1);

    unsubscribe();
    bus.publish('dashboard:refresh', { source: 'after-unsub' }, 'unit-test');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('rejects invalid payloads without notifying subscribers or recording history', () => {
    const bus = getEventBus();
    const handler = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    bus.subscribe('user:selected', handler);

    bus.publish(
      'user:selected',
      { id: '1', name: 42 } as unknown as { id: string; name: string },
      'unit-test',
    );

    expect(handler).not.toHaveBeenCalled();
    expect(bus.getHistory()).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('isolates subscriber errors so other handlers still run', () => {
    const bus = getEventBus();
    const failing = vi.fn(() => {
      throw new Error('subscriber boom');
    });
    const succeeding = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    bus.subscribe('analytics:track', failing);
    bus.subscribe('analytics:track', succeeding);
    bus.publish('analytics:track', { action: 'click' }, 'unit-test');

    expect(failing).toHaveBeenCalledOnce();
    expect(succeeding).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('caps history at 200 events', () => {
    const bus = getEventBus();

    for (let i = 0; i < 205; i++) {
      bus.publish('analytics:track', { action: `event-${i}` }, 'unit-test');
    }

    const history = bus.getHistory();
    expect(history).toHaveLength(200);
    expect(history[0].payload).toEqual({ action: 'event-5' });
    expect(history[history.length - 1].payload).toEqual({ action: 'event-204' });
  });

  it('clearHistory removes all recorded events', () => {
    const bus = getEventBus();
    bus.publish('analytics:track', { action: 'ping' }, 'unit-test');
    expect(bus.getHistory()).toHaveLength(1);

    bus.clearHistory();
    expect(bus.getHistory()).toHaveLength(0);
  });
});
