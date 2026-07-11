import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createParticipant, getParticipants } from './participantsApi.js';

describe('participantsApi', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  // Helper: abort-aware never-resolving fetch mock for timeout tests
  function abortAwarePendingMock() {
    return vi.fn((_url, options) =>
      new Promise((_resolve, reject) => {
        if (options?.signal) {
          if (options.signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          }, { once: true });
        }
        // Never resolve — pending until aborted
      })
    );
  }

  // RELIABILITY-001-1: getParticipants uses correct path, method, and parses JSON
  it('GET /participants returns parsed JSON on success', async () => {
    const payload = [{ id: 'p1', name: 'Alice', email: 'alice@example.com' }];
    globalThis.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) });

    const result = await getParticipants();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toMatch(/\/participants$/);
    expect(options).toEqual({ signal: expect.any(AbortSignal) });
    expect(result).toEqual(payload);
  });

  // RELIABILITY-001-2: getParticipants propagates backend error
  it('GET /participants throws error from backend response body on failure', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Database offline' }),
    });

    await expect(getParticipants()).rejects.toThrow('Database offline');
  });

  // RELIABILITY-001-3: createParticipant uses correct path, method, headers, and body
  it('POST /participants sends correct method, headers, and body', async () => {
    const saved = { id: 'p2', name: 'Bob', email: 'bob@example.com' };
    globalThis.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(saved) });

    const result = await createParticipant({ name: 'Bob', email: 'bob@example.com' });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toMatch(/\/participants$/);
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body)).toEqual({ name: 'Bob', email: 'bob@example.com' });
    expect(result).toEqual(saved);
  });

  // RELIABILITY-001-4: createParticipant propagates backend error
  it('POST /participants throws error from backend response body on failure', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Email is already registered' }),
    });

    await expect(
      createParticipant({ name: 'Bob', email: 'bob@example.com' })
    ).rejects.toThrow('Email is already registered');
  });

  // RESILIENCE-001-1: getParticipants passes signal to fetch and rejects on abort
  it('GET /participants rejects with a controlled error when aborted via signal', async () => {
    globalThis.fetch.mockImplementation((_url, options) => {
      if (options?.signal?.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const controller = new AbortController();
    controller.abort();

    await expect(getParticipants({ signal: controller.signal })).rejects.toThrow(
      /timed out|cancel|abort/i
    );
  });

  // RESILIENCE-001-2: explicit timeoutMs override rejects deterministically
  it('rejects with timeout error after explicit timeoutMs when request hangs', async () => {
    vi.useFakeTimers();
    globalThis.fetch = abortAwarePendingMock();

    const promise = getParticipants({ timeoutMs: 200 });

    vi.advanceTimersByTime(200);
    await vi.runAllTicks();

    await expect(promise).rejects.toThrow(/timed out/i);
  });

  // RESILIENCE-001-3: no-options getParticipants uses bounded default timeout (3s)
  it('does not abort before default threshold and aborts exactly when threshold is reached', async () => {
    vi.useFakeTimers();
    globalThis.fetch = abortAwarePendingMock();

    const promise = getParticipants();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, options] = globalThis.fetch.mock.calls[0];

    // 1ms before the default threshold — signal must NOT be aborted
    vi.advanceTimersByTime(2999);
    await vi.runAllTicks();
    expect(options.signal.aborted).toBe(false);

    // Cross the 3s threshold by 1ms — signal must NOW be aborted
    vi.advanceTimersByTime(1);
    await vi.runAllTicks();
    expect(options.signal.aborted).toBe(true);

    await expect(promise).rejects.toThrow(/timed out/i);
  });

  // --- Mutation timeout/abort mirror tests (RED — mutation path has no timeout yet) ---

  // RESILIENCE-002-1: createParticipant rejects with controlled error when aborted via external signal
  it('POST /participants rejects with a controlled error when aborted via signal', async () => {
    globalThis.fetch.mockImplementation((_url, options) => {
      if (options?.signal?.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const controller = new AbortController();
    controller.abort();

    await expect(
      createParticipant({ name: 'Test', email: 't@t.com', signal: controller.signal })
    ).rejects.toThrow(/timed out|cancel|abort/i);
  });

  // RESILIENCE-002-2: createParticipant rejects with timeout after explicit timeoutMs when request hangs
  it('POST /participants rejects with timeout error after explicit timeoutMs when request hangs', async () => {
    vi.useFakeTimers();
    globalThis.fetch = abortAwarePendingMock();

    const promise = createParticipant({ name: 'Test', email: 't@t.com', timeoutMs: 200 });

    vi.advanceTimersByTime(200);
    await vi.runAllTicks();

    await expect(promise).rejects.toThrow(/timed out/i);
  });

  // RESILIENCE-002-3: createParticipant uses default timeout — aborts exactly at 3s
  it('POST /participants does not abort before default threshold and aborts exactly when threshold is reached', async () => {
    vi.useFakeTimers();
    globalThis.fetch = abortAwarePendingMock();

    const promise = createParticipant({ name: 'Test', email: 't@t.com' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, options] = globalThis.fetch.mock.calls[0];

    // 1ms before the default threshold — signal must NOT be aborted
    vi.advanceTimersByTime(2999);
    await vi.runAllTicks();
    expect(options.signal.aborted).toBe(false);

    // Cross the 3s threshold by 1ms — signal must NOW be aborted
    vi.advanceTimersByTime(1);
    await vi.runAllTicks();
    expect(options.signal.aborted).toBe(true);

    await expect(promise).rejects.toThrow(/timed out/i);
  });

  // RESILIENCE-002-4: timeoutMs=0 leaves mutation pending — no abort ever fires
  it('POST /participants does not abort pending request with timeoutMs 0 after advancing beyond default threshold', async () => {
    vi.useFakeTimers();
    globalThis.fetch = abortAwarePendingMock();

    const controller = new AbortController();
    const promise = createParticipant({
      name: 'Test',
      email: 't@t.com',
      timeoutMs: 0,
      signal: controller.signal,
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, options] = globalThis.fetch.mock.calls[0];

    // Advance well beyond default threshold — signal must NOT be aborted
    vi.advanceTimersByTime(5000);
    await vi.runAllTicks();
    expect(options.signal.aborted).toBe(false);

    // Explicitly abort and assert controlled rejection, leaving no dangling promise/listener
    controller.abort();
    await vi.runAllTicks();
    await expect(promise).rejects.toThrow(/timed out|cancel|abort/i);
  });

  // RESILIENCE-001-4: timeoutMs=0 leaves request pending — no abort ever fires
  it('does not abort pending request with timeoutMs 0 after advancing beyond default threshold', async () => {
    vi.useFakeTimers();
    globalThis.fetch = abortAwarePendingMock();

    const controller = new AbortController();
    const promise = getParticipants({ timeoutMs: 0, signal: controller.signal });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, options] = globalThis.fetch.mock.calls[0];

    // Advance well beyond default threshold — signal must NOT be aborted
    vi.advanceTimersByTime(5000);
    await vi.runAllTicks();
    expect(options.signal.aborted).toBe(false);

    // Explicitly abort and assert controlled rejection, leaving no dangling promise/listener
    controller.abort();
    await vi.runAllTicks();
    await expect(promise).rejects.toThrow(/timed out|cancel|abort/i);
  });
});
