import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEventBus, type MfeEvent } from '../event-bus';
import { api } from './client';

describe('shared api client', () => {
  const bus = getEventBus();
  const events: MfeEvent<'api:event'>[] = [];
  let unsub: (() => void) | undefined;

  afterEach(() => {
    unsub?.();
    events.length = 0;
    bus.clearHistory();
  });

  it('publishes telemetry and logging api:event payloads to the bus', async () => {
    unsub = bus.subscribe('api:event', (event) => {
      events.push(event);
    });

    const action = api
      .metadata({ feature: 'test', action: 'ping' })
      .handler(async () => 'ok');

    await action({});

    const kinds = events.map((event) => event.payload.kind);
    expect(kinds).toContain('span:start');
    expect(kinds).toContain('span:end');
    expect(kinds.filter((kind) => kind === 'log:info').length).toBeGreaterThanOrEqual(2);
    expect(events.every((event) => event.source === 'mfe-shared/api')).toBe(true);
  });

  it('publishes log:error api:event when the handler throws', async () => {
    unsub = bus.subscribe('api:event', (event) => {
      events.push(event);
    });

    const action = api
      .metadata({ feature: 'test', action: 'fail' })
      .handler(async () => {
        throw new Error('boom');
      });

    await action({}).catch(() => undefined);

    const errorLogs = events.filter((event) => event.payload.kind === 'log:error');
    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    expect(errorLogs[0].payload.error).toBe('boom');
  });
});
