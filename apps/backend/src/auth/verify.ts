import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface VerifiedToken {
  sub: string;
  sessionId: string | undefined;
}

export type Verifier = (token: string) => Promise<VerifiedToken>;

export interface VerifyConfig {
  jwksUrl: URL;
  issuer: string;
  audience: string;
}

/**
 * Build a JWKS token verifier. `keyOverride` exists for tests: it lets a test
 * pass `createLocalJWKSet(...)` instead of reaching the network.
 */
export function createVerifier(config: VerifyConfig, keyOverride?: JWTVerifyGetKey): Verifier {
  const key = keyOverride ?? createRemoteJWKSet(config.jwksUrl);

  return async (token) => {
    const { payload } = await jwtVerify(token, key, {
      issuer: config.issuer,
      audience: config.audience,
      // Only asymmetric Supabase signing keys. A stolen HMAC secret must never
      // let a caller mint tokens, so HS256 is not accepted.
      algorithms: ['ES256', 'RS256'],
    });

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('missing sub');
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
