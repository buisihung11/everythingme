import { describe, it, expect, vi, afterEach } from 'vitest';
import { createMockTransport } from './transport';

describe('createMockTransport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns fixture data for a known path', async () => {
    const transport = createMockTransport(
      { '/stats': { totalUsers: 10 } },
      { latencyMs: 0 },
    );

    const result = await transport.get<{ totalUsers: number }>('/stats');
    expect(result).toEqual({ totalUsers: 10 });
  });

  it('throws when no fixture exists for the requested path', async () => {
    const transport = createMockTransport({}, { latencyMs: 0 });

    await expect(transport.get('/missing')).rejects.toThrow(
      'Mock transport: no fixture for path "/missing"',
    );
  });

  it('rejects with AbortError when hang mode receives an abort signal', async () => {
    const transport = createMockTransport(
      { '/stats': { ok: true } },
      { hang: true, latencyMs: 0 },
    );
    const controller = new AbortController();

    const promise = transport.get('/stats', { signal: controller.signal });
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects with AbortError when latency is interrupted by abort', async () => {
    const transport = createMockTransport(
      { '/stats': { ok: true } },
      { latencyMs: 500 },
    );
    const controller = new AbortController();

    const promise = transport.get('/stats', { signal: controller.signal });
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('fails according to flakiness when random rolls below threshold', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const transport = createMockTransport(
      { '/stats': { ok: true } },
      { latencyMs: 0, flakiness: 0.5 },
    );

    await expect(transport.get('/stats')).rejects.toThrow(/flaky failure/);
  });

  it('succeeds when random roll is above flakiness threshold', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const transport = createMockTransport(
      { '/stats': { ok: true } },
      { latencyMs: 0, flakiness: 0.5 },
    );

    await expect(transport.get('/stats')).resolves.toEqual({ ok: true });
  });

  it('setFlakiness and setHang update runtime behaviour', async () => {
    const transport = createMockTransport(
      { '/stats': { ok: true } },
      { latencyMs: 0, flakiness: 0 },
    );

    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    transport.setFlakiness(0.5);
    await expect(transport.get('/stats')).rejects.toThrow(/flaky failure/);

    transport.setFlakiness(0);
    await expect(transport.get('/stats')).resolves.toEqual({ ok: true });

    transport.setHang(true);
    const controller = new AbortController();
    const hangPromise = transport.get('/stats', { signal: controller.signal });
    controller.abort();
    await expect(hangPromise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
