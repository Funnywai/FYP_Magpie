import {
  createRemoteJWKSet,
  customFetch,
  errors,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTPayload,
} from 'jose';

import { httpFetch } from '../http.js';

export interface VerifiedToken {
  readonly sub: string;
  readonly sessionId: string | undefined;
}

export type Verifier = (token: string) => Promise<VerifiedToken>;

export interface VerifyConfig {
  readonly jwksUrl: URL;
  readonly issuer: string;
  readonly audience: string;
}

/** The caller presented a token we will not accept (signature, claims, expiry). */
export class InvalidTokenError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidTokenError';
  }
}

/** The JWKS dependency could not answer, so no token can be judged. */
export class AuthUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AuthUnavailableError';
  }
}

const UNAVAILABLE_JOSE_CODES: ReadonlySet<string> = new Set([
  'ERR_JWKS_TIMEOUT',
  'ERR_JWKS_INVALID',
  'ERR_JOSE_GENERIC',
]);

/**
 * jose uses JOSEError subclasses for both bad tokens and broken key retrieval.
 * Only dependency failures may surface as 5xx; every other JOSE error is a
 * token rejection. Unknown errors are bugs and must reach the 500 handler.
 */
function classifyVerificationError(error: unknown): never {
  if (error instanceof AuthUnavailableError) throw error;
  if (error instanceof errors.JOSEError) {
    if (UNAVAILABLE_JOSE_CODES.has(error.code)) {
      throw new AuthUnavailableError('JWKS unavailable', { cause: error });
    }
    throw new InvalidTokenError(error.message);
  }
  throw error;
}

/**
 * jose only converts a DOM TimeoutError; every other fetch failure and any
 * non-200 response would otherwise look like a token failure. Tag dependency
 * failures here, before jose can collapse them.
 */
const jwksFetch: typeof fetch = async (input, init) => {
  let response: Response;
  try {
    response = await httpFetch(input, init);
  } catch (error) {
    throw new AuthUnavailableError('JWKS request failed', { cause: error });
  }
  if (response.status !== 200) {
    void response.body?.cancel().catch(() => undefined);
    throw new AuthUnavailableError(`JWKS responded with ${response.status}`);
  }
  return response;
};

/**
 * Build a JWKS token verifier. `keyOverride` exists for tests: it lets a test
 * pass `createLocalJWKSet(...)` instead of reaching the network.
 */
export function createVerifier(config: VerifyConfig, keyOverride?: JWTVerifyGetKey): Verifier {
  const key =
    keyOverride ??
    createRemoteJWKSet(config.jwksUrl, {
      timeoutDuration: 30_000,
      [customFetch]: jwksFetch,
    });

  return async (token) => {
    let payload: JWTPayload;
    try {
      ({ payload } = await jwtVerify(token, key, {
        issuer: config.issuer,
        audience: config.audience,
        // Only asymmetric Supabase signing keys. A stolen HMAC secret must never
        // let a caller mint tokens, so HS256 is not accepted.
        algorithms: ['ES256', 'RS256'],
      }));
    } catch (error) {
      classifyVerificationError(error);
    }

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new InvalidTokenError('missing sub');
    }

    return {
      sub: payload.sub,
      sessionId: typeof payload.session_id === 'string' ? payload.session_id : undefined,
    };
  };
}

/** Read auth configuration from env. */
export function verifierFromEnv(): Verifier {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('SUPABASE_URL is required');

  const base = supabaseUrl.replace(/\/+$/, '');
  const issuer = `${base}/auth/v1`;

  return createVerifier({
    jwksUrl: new URL(`${issuer}/.well-known/jwks.json`),
    issuer,
    audience: 'authenticated',
  });
}
