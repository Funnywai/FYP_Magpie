import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';

import { createVerifier } from '../src/auth/verify.js';

const ISSUER = 'http://127.0.0.1:54321/auth/v1';
const AUDIENCE = 'authenticated';

let privateKey: CryptoKey;
let jwks: ReturnType<typeof createLocalJWKSet>;

async function sign(
  claims: JWTPayload = {},
  options: { issuer?: string; audience?: string; expiresIn?: string; subject?: string } = {},
): Promise<string> {
  const builder = new SignJWT({ session_id: 'sess-1', ...claims })
    .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
    .setIssuer(options.issuer ?? ISSUER)
    .setAudience(options.audience ?? AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(options.expiresIn ?? '1h');
  if (options.subject !== '') builder.setSubject(options.subject ?? 'user-1');
  return builder.sign(privateKey);
}

beforeAll(async () => {
  const pair = await generateKeyPair('ES256');
  privateKey = pair.privateKey;
  const jwk = await exportJWK(pair.publicKey);
  jwks = createLocalJWKSet({ keys: [{ ...jwk, kid: 'test-key', alg: 'ES256', use: 'sig' }] });
});

describe('createVerifier (JWKS)', () => {
  const verifier = () => createVerifier({ jwksUrl: new URL('https://unused.test/jwks'), issuer: ISSUER, audience: AUDIENCE }, jwks);

  it('returns sub and session id for a valid ES256 token', async () => {
    await expect(verifier()(await sign())).resolves.toEqual({ sub: 'user-1', sessionId: 'sess-1' });
  });

  it('rejects a token signed by another key', async () => {
    const other = await generateKeyPair('ES256');
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setSubject('user-1')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(other.privateKey);
    await expect(verifier()(token)).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    await expect(verifier()(await sign({}, { expiresIn: '-1s' }))).rejects.toThrow();
  });

  it('rejects a wrong issuer', async () => {
    await expect(verifier()(await sign({}, { issuer: 'https://evil.test/auth/v1' }))).rejects.toThrow();
  });

  it('rejects a wrong audience', async () => {
    await expect(verifier()(await sign({}, { audience: 'anon' }))).rejects.toThrow();
  });

  it('rejects a token with no sub', async () => {
    await expect(verifier()(await sign({}, { subject: '' }))).rejects.toThrow('missing sub');
  });

  it('rejects an HS256 token even if it has a matching kid', async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256', kid: 'test-key' })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setSubject('user-1')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('test-secret-at-least-32-characters-long'));

    await expect(verifier()(token)).rejects.toThrow();
  });
});
