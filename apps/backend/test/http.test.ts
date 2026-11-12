import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHttpClient } from '../src/http.js';

function response(status: number): Response {
  return new Response(status === 204 ? null : '{}', { status });
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
});
