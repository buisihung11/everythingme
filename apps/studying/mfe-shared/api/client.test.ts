import { beforeEach, describe, expect, it } from 'vitest';
import { getEventBus } from '../event-bus';
import { api } from './client';

describe('shared api client', () => {
  const bus = getEventBus();

  beforeEach(() => {
    bus.clearHistory();
  });

  it('publishes telemetry and logging events to the event bus on success', async () => {
    const action = api
      .metadata({ feature: 'test', action: 'ping' })
      .handler(async () => 'ok');

    await action({});

    const events = bus.getHistory().filter((event) => event.type === 'api:event');
    const kinds = events.map((event) => event.payload.kind);

    expect(kinds).toContain('span:start');
    expect(kinds).toContain('span:end');
    expect(kinds).toContain('log:info');
  });

  it('publishes error log events when the handler throws', async () => {
    const action = api
      .metadata({ feature: 'test', action: 'fail' })
      .handler(async () => {
        throw new Error('boom');
      });

    await action({}).catch(() => undefined);

    const errorEvents = bus
      .getHistory()
      .filter(
        (event) =>
          event.type === 'api:event' && event.payload.kind === 'log:error',
      );

    expect(errorEvents).toHaveLength(1);
    expect(errorEvents[0].payload.label).toContain('fail');
  });
});
