import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import type { ApiError, ApiErrorCode, ListItemsResponse } from '@magpie/shared';

import { httpFetch } from './http';
import { supabase } from './supabase';

const ERROR_CODES: readonly ApiErrorCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8787';

export class ApiClientError extends Error {
  constructor(
    readonly code: ApiErrorCode | 'NETWORK',
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type RefreshResult = { ok: true } | { ok: false; sessionLost: boolean };

let refreshInFlight: Promise<RefreshResult> | null = null;

export function resetApiRefresh(): void {
  refreshInFlight = null;
}

async function refreshOnce(): Promise<RefreshResult> {
  refreshInFlight ??= supabase.auth
    .refreshSession()
    .then(({ data, error }) => {
      if (!error && data.session) return { ok: true } as const;
      if (isAuthRetryableFetchError(error)) return { ok: false, sessionLost: false } as const;
      return { ok: false, sessionLost: !data.session } as const;
    })
    .catch(() => ({ ok: false, sessionLost: false }) as const)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

async function currentSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

async function bearer(expectedUserId: string): Promise<string> {
  const session = await currentSession();
  if (!session) throw new ApiClientError('UNAUTHENTICATED', 'No active session');
  if (session.user.id !== expectedUserId) {
    throw new ApiClientError('UNAUTHENTICATED', 'Session changed');
  }
  return session.access_token;
}

async function raw(path: string, init: RequestInit, expectedUserId: string): Promise<Response> {
  return httpFetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${await bearer(expectedUserId)}`,
      'Content-Type': 'application/json',
    },
  });
}

function isApiErrorCode(value: string | undefined): value is ApiErrorCode {
  return value !== undefined && (ERROR_CODES as readonly string[]).includes(value);
}

function networkError(error: unknown): ApiClientError {
  return error instanceof ApiClientError ? error : new ApiClientError('NETWORK', 'Network request failed');
}

async function signOutLocally(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    console.warn('[api] local sign-out failed:', error instanceof Error ? error.message : error);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await currentSession();
  if (!session) throw new ApiClientError('UNAUTHENTICATED', 'No active session');
  const userId = session.user.id;

  let response: Response;
  try {
    response = await raw(path, init, userId);
  } catch (error) {
    throw networkError(error);
  }

  if (response.status === 401) {
    const refresh = await refreshOnce();
    if (refresh.ok) {
      try {
        response = await raw(path, init, userId);
      } catch (error) {
        throw networkError(error);
      }
    } else if (refresh.sessionLost) {
      throw new ApiClientError('UNAUTHENTICATED', 'Session expired');
    } else {
      throw new ApiClientError('NETWORK', 'Session refresh failed');
    }
  }

  if (response.status === 401) {
    const latest = await currentSession();
    if (latest?.user.id === userId) await signOutLocally();
    throw new ApiClientError('UNAUTHENTICATED', 'Session expired');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    const rawCode = body?.error?.code;
    const code = isApiErrorCode(rawCode) ? rawCode : 'INTERNAL';
    throw new ApiClientError(code, body?.error?.message ?? 'Request failed');
  }

  return (await response.json()) as T;
}

export function listItems(): Promise<ListItemsResponse> {
  return apiFetch<ListItemsResponse>('/api/items');
}
