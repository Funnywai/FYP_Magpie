import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
const refreshSession = vi.fn();
const signOut = vi.fn();

vi.mock('./supabase', () => ({
  supabase: { auth: { getSession, refreshSession, signOut } },
}));

const { apiFetch } = await import('./api');

const SESSION_A = { access_token: 'token-1', user: { id: 'user-a' } };
const SESSION_A2 = { access_token: 'token-2', user: { id: 'user-a' } };
const SESSION_B = { access_token: 'token-b', user: { id: 'user-b' } };

function ok(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function unauthorized(): Response {
  return {
    ok: false,
    status: 401,
    json: async () => ({ error: { code: 'UNAUTHENTICATED', message: 'expired' } }),
  } as Response;
}

function session(value: typeof SESSION_A | typeof SESSION_B | null) {
  return { data: { success: true, session: value } };
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  getSession.mockResolvedValue(session(SESSION_A));
  refreshSession.mockResolvedValue({ data: { session: SESSION_A2 }, error: null });
  signOut.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('apiFetch', () => {
  it('sends the signed-in user token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(ok({ items: [], nextCursor: null }));

    await expect(apiFetch('/api/items')).resolves.toEqual({ items: [], nextCursor: null });

    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token-1');
  });

  it('refreshes once and retries with the new token', async () => {
    getSession
      .mockResolvedValueOnce(session(SESSION_A))
      .mockResolvedValueOnce(session(SESSION_A))
      .mockResolvedValueOnce(session(SESSION_A2));
    vi.mocked(fetch)
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(ok({ ok: true }));

    await expect(apiFetch('/api/items')).resolves.toEqual({ ok: true });

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    const [, retry] = vi.mocked(fetch).mock.calls[1]!;
    expect((retry?.headers as Record<string, string>).Authorization).toBe('Bearer token-2');
  });

  it('signs out locally when the retry is still 401', async () => {
    getSession
      .mockResolvedValueOnce(session(SESSION_A))
      .mockResolvedValueOnce(session(SESSION_A))
      .mockResolvedValueOnce(session(SESSION_A2))
      .mockResolvedValueOnce(session(SESSION_A2));
    vi.mocked(fetch).mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(unauthorized());

    await expect(apiFetch('/api/items')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });

    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('rejects without a session before making a request', async () => {
    getSession.mockResolvedValue(session(null));

    await expect(apiFetch('/api/items')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not sign out on a retryable refresh failure', async () => {
    getSession.mockResolvedValueOnce(session(SESSION_A)).mockResolvedValueOnce(session(SESSION_A));
    refreshSession.mockResolvedValueOnce({
      data: { session: null },
      error: new AuthRetryableFetchError('network', 0),
    });
    vi.mocked(fetch).mockResolvedValueOnce(unauthorized());

    await expect(apiFetch('/api/items')).rejects.toMatchObject({ code: 'NETWORK' });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('rejects when the refresh reports a lost session', async () => {
    getSession.mockResolvedValueOnce(session(SESSION_A)).mockResolvedValueOnce(session(SESSION_A));
    refreshSession.mockResolvedValueOnce({
      data: { session: null },
      error: new AuthApiError('invalid refresh token', 400, 'invalid_grant'),
    });
    vi.mocked(fetch).mockResolvedValueOnce(unauthorized());

    await expect(apiFetch('/api/items')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('does not retry with a different user session', async () => {
    getSession
      .mockResolvedValueOnce(session(SESSION_A))
      .mockResolvedValueOnce(session(SESSION_A))
      .mockResolvedValueOnce(session(SESSION_B));
    vi.mocked(fetch).mockResolvedValueOnce(unauthorized());

    await expect(apiFetch('/api/items')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('surfaces a network failure as NETWORK', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Network request failed'));

    await expect(apiFetch('/api/items')).rejects.toMatchObject({ code: 'NETWORK' });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('maps an unknown error body to INTERNAL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({}),
    } as Response);

    await expect(apiFetch('/api/items')).rejects.toMatchObject({ code: 'INTERNAL' });
  });

  it('does not refresh or sign out when auth is temporarily unavailable', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        error: { code: 'INTERNAL', message: 'Authentication temporarily unavailable' },
      }),
    } as Response);

    await expect(apiFetch('/api/items')).rejects.toMatchObject({
      code: 'INTERNAL',
      message: 'Authentication temporarily unavailable',
    });
    expect(refreshSession).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });
});
