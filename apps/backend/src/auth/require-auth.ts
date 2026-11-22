import type { MiddlewareHandler } from 'hono';

import { apiError } from '../errors.js';
import { extractBearer } from './extract-bearer.js';
import {
  AuthUnavailableError,
  InvalidTokenError,
  verifierFromEnv,
  type Verifier,
} from './verify.js';

export type AuthEnv = {
  Variables: {
    userId: string;
    accessToken: string;
  };
};

let defaultVerifier: Verifier | undefined;

export function createRequireAuth(verify: Verifier): MiddlewareHandler<AuthEnv> {
  return async (c, next) => {
    const token = extractBearer(c.req.header('Authorization'));
    if (!token) {
      return c.json(apiError('UNAUTHENTICATED', 'Missing or malformed Authorization header'), 401);
    }

    let sub: string;
    try {
      ({ sub } = await verify(token));
    } catch (error) {
      // Log the reason, never the token: verification failures are useful in dev
      // and a token in logs is a credential leak.
      if (error instanceof InvalidTokenError) {
        console.warn('[auth] token verification failed:', error.message);
        return c.json(apiError('UNAUTHENTICATED', 'Invalid or expired token'), 401);
      }
      if (error instanceof AuthUnavailableError) {
        console.error('[auth] token verification unavailable:', error.message);
        return c.json(apiError('INTERNAL', 'Authentication temporarily unavailable'), 503);
      }
      // An unexpected verifier failure is an internal bug, not a bad session.
      // Let it reach the 500 handler instead of signing the user out.
      throw error;
    }

    // Only auth failures become 401. Downstream errors must surface as 5xx,
    // otherwise a route bug looks like an expired session to the client.
    c.set('userId', sub);
    c.set('accessToken', token);
    await next();
  };
}

/**
 * Env-backed verifier. It is resolved only after `createRequireAuth` has parsed
 * a token, so a request without a header still returns 401 when env vars are
 * absent (the backend test suite imports the app without a `.env`).
 */
const lazyVerifier: Verifier = (token) => {
  defaultVerifier ??= verifierFromEnv();
  return defaultVerifier(token);
};

export const requireAuth: MiddlewareHandler<AuthEnv> = createRequireAuth(lazyVerifier);

/**
 * Validate auth configuration at boot so a missing SUPABASE_URL fails the
 * deploy immediately instead of turning every authenticated request into a 401.
 */
export function initAuth(): void {
  defaultVerifier ??= verifierFromEnv();
}
