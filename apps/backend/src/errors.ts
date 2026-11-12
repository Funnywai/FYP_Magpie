import type { ApiError, ApiErrorCode } from '@magpie/shared';

/** Build the single error envelope every route returns (SPEC §5). */
export function apiError(code: ApiErrorCode, message: string): ApiError {
  return { error: { code, message } };
}

export interface MappedError {
  status: 401 | 403 | 500;
  body: ApiError;
}

/**
 * Translate a Supabase/PostgREST error into our envelope.
 * Upstream messages can name tables and policies, so they never reach the client.
 */
export function mapDataApiError(error: { code?: string; message?: string }): MappedError {
  if (error.code === 'PGRST301' || error.code === 'PGRST302') {
    return { status: 401, body: apiError('UNAUTHENTICATED', 'Invalid or expired session') };
  }
  if (error.code === '42501') {
    return { status: 403, body: apiError('FORBIDDEN', 'Not allowed') };
  }
  return { status: 500, body: apiError('INTERNAL', 'Something went wrong') };
}
