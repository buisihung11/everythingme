import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockTransport } from './transport';

describe('createMockTransport', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns fixture data after configured latency', async () => {
    vi.useFakeTimers();

    const transport = createMockTransport(
      { '/stats': { totalUsers: 10 } },
      { latencyMs: 100 },
    );

    const promise = transport.get<{ totalUsers: number }>('/stats');
    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toEqual({ totalUsers: 10 });
  });

  it('throws when the requested path has no fixture', async () => {
    vi.useFakeTimers();

    const transport = createMockTransport({}, { latencyMs: 0 });
    const promise = transport.get('/missing');
    const assertion = expect(promise).rejects.toThrow('no fixture for path "/missing"');

    await vi.advanceTimersByTimeAsync(0);
    await assertion;
  });

  it('hang mode never resolves until the abort signal fires', async () => {
    vi.useFakeTimers();

    const transport = createMockTransport({ '/stats': { ok: true } }, { latencyMs: 0 });
    transport.setHang(true);

    const controller = new AbortController();
    const promise = transport.get('/stats', { signal: controller.signal });
    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' });

    await vi.advanceTimersByTimeAsync(10_000);
    controller.abort();
    await assertion;
  });

  it('aborts an in-flight latency timer when the signal is cancelled', async () => {
    vi.useFakeTimers();

    const transport = createMockTransport({ '/stats': { ok: true } }, { latencyMs: 500 });
    const controller = new AbortController();
    const promise = transport.get('/stats', { signal: controller.signal });
    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' });

    await vi.advanceTimersByTimeAsync(100);
    controller.abort();
    await assertion;
  });

  it('fails flaky calls based on the configured flakiness rate', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const transport = createMockTransport({ '/stats': { ok: true } }, { latencyMs: 0 });
    transport.setFlakiness(0.5);

    const promise = transport.get('/stats');
    const assertion = expect(promise).rejects.toThrow('Mock transport flaky failure (attempt 1)');

    await vi.advanceTimersByTimeAsync(0);
    await assertion;
  });

  it('setHang and setFlakiness update runtime behaviour', async () => {
    vi.useFakeTimers();

    const transport = createMockTransport({ '/stats': { ok: true } }, { latencyMs: 0 });

    transport.setHang(true);
    const hanging = transport.get('/stats');
    await vi.advanceTimersByTimeAsync(1_000);
    let settled = false;
    void hanging.then(() => {
      settled = true;
    });
    expect(settled).toBe(false);

    transport.setHang(false);
    transport.setFlakiness(0);

    const promise = transport.get('/stats');
    await vi.advanceTimersByTimeAsync(0);
    await expect(promise).resolves.toEqual({ ok: true });
  });
});
