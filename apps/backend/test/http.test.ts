import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHttpClient } from '../src/http.js';

function response(status: number): Response {
  return new Response(status === 204 ? null : '{}', { status });
}

/** Behaves like a real transport: the response body errors when the request aborts. */
function streamingResponse(init?: RequestInit): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      init?.signal?.addEventListener('abort', () => controller.error(init.signal?.reason), { once: true });
    },
  });
  return new Response(body, { status: 200 });
}

function streamingFetch(): ReturnType<typeof vi.fn> {
  return vi.fn().mockImplementation((_input: Parameters<typeof fetch>[0], init?: RequestInit) =>
    Promise.resolve(streamingResponse(init)),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createHttpClient', () => {
  it('returns a successful response on the first attempt', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(200));
    const client = createHttpClient({ fetchImpl, baseDelayMs: 0 });

    const result = await client('https://example.test/resource');

    expect(result.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries a retryable status for a GET', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(response(503)).mockResolvedValueOnce(response(200));
    const client = createHttpClient({ fetchImpl, baseDelayMs: 0 });

    const result = await client('https://example.test/resource');

    expect(result.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('redacts query strings from logs', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(200));
    const client = createHttpClient({ fetchImpl, baseDelayMs: 0 });

    await client('https://example.test/resource?api_key=secret');

    const logged = vi.mocked(console.info).mock.calls.flat().join(' ');
    expect(logged).toContain('https://example.test/resource');
    expect(logged).not.toContain('api_key=secret');
  });

  it('does not retry a 401', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(401));
    const client = createHttpClient({ fetchImpl, baseDelayMs: 0 });

    const result = await client('https://example.test/resource');

    expect(result.status).toBe(401);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not retry a non-idempotent request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(503));
    const client = createHttpClient({ fetchImpl, baseDelayMs: 0 });

    const result = await client('https://example.test/resource', { method: 'POST' });

    expect(result.status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries network failures up to the configured limit', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const client = createHttpClient({ fetchImpl, retries: 1, baseDelayMs: 0 });

    await expect(client('https://example.test/resource')).rejects.toThrow('fetch failed');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('aborts a request that exceeds the timeout', async () => {
    const fetchImpl = vi.fn().mockImplementation((_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason);
        });
      });
    });
    const client = createHttpClient({ fetchImpl, timeoutMs: 10, retries: 0 });

    await expect(client('https://example.test/resource')).rejects.toThrow('HTTP timeout');
  });

  it(
    'keeps the timeout active while the response body is read',
    async () => {
      const client = createHttpClient({ fetchImpl: streamingFetch(), timeoutMs: 10, retries: 0 });

      const result = await client('https://example.test/resource');

      await expect(result.text()).rejects.toThrow('HTTP timeout');
    },
    1000,
  );

  it(
    'keeps the caller abort signal connected while the response body is read',
    async () => {
      const client = createHttpClient({ fetchImpl: streamingFetch(), timeoutMs: 1000, retries: 0 });
      const caller = new AbortController();

      const result = await client('https://example.test/resource', { signal: caller.signal });
      caller.abort();

      await expect(result.text()).rejects.toThrow();
    },
    1000,
  );

  it(
    'keeps a Request input signal connected while the response body is read',
    async () => {
      const client = createHttpClient({ fetchImpl: streamingFetch(), timeoutMs: 50, retries: 0 });
      const caller = new AbortController();
      const request = new Request('https://example.test/resource', { signal: caller.signal });

      const result = await client(request);
      caller.abort(new Error('caller aborted'));

      await expect(result.text()).rejects.toThrow('caller aborted');
    },
    1000,
  );

  it(
    'inherits the Request input signal when init.signal is undefined',
    async () => {
      const client = createHttpClient({ fetchImpl: streamingFetch(), timeoutMs: 50, retries: 0 });
      const caller = new AbortController();
      const request = new Request('https://example.test/resource', { signal: caller.signal });

      const result = await client(request, { signal: undefined });
      caller.abort(new Error('caller aborted'));

      await expect(result.text()).rejects.toThrow('caller aborted');
    },
    1000,
  );

  it(
    'lets an explicit init signal override the Request input signal',
    async () => {
      const client = createHttpClient({ fetchImpl: streamingFetch(), timeoutMs: 100, retries: 0 });
      const requestCaller = new AbortController();
      const initCaller = new AbortController();
      const request = new Request('https://example.test/resource', { signal: requestCaller.signal });

      const result = await client(request, { signal: initCaller.signal });
      requestCaller.abort(new Error('request aborted'));
      initCaller.abort(new Error('init aborted'));

      await expect(result.text()).rejects.toThrow('init aborted');
    },
    1000,
  );

  it(
    'treats an explicit null signal as clearing the Request input signal',
    async () => {
      const client = createHttpClient({ fetchImpl: streamingFetch(), timeoutMs: 50, retries: 0 });
      const caller = new AbortController();
      const request = new Request('https://example.test/resource', { signal: caller.signal });

      const result = await client(request, { signal: null });
      caller.abort(new Error('request aborted'));

      await expect(result.text()).rejects.toThrow('HTTP timeout');
    },
    1000,
  );

  it('does not retry when the Request input signal is already aborted', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const client = createHttpClient({ fetchImpl, retries: 2, baseDelayMs: 0 });
    const caller = new AbortController();
    caller.abort(new Error('caller aborted'));
    const request = new Request('https://example.test/resource', { signal: caller.signal });

    await expect(client(request)).rejects.toThrow('fetch failed');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries a network failure when init.signal overrides an aborted Request signal', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const client = createHttpClient({ fetchImpl, retries: 1, baseDelayMs: 0 });
    const requestCaller = new AbortController();
    requestCaller.abort(new Error('request aborted'));
    const request = new Request('https://example.test/resource', { signal: requestCaller.signal });
    const initCaller = new AbortController();

    await expect(client(request, { signal: initCaller.signal })).rejects.toThrow('fetch failed');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
