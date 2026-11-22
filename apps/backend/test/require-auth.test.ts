import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';

import { createRequireAuth, type AuthEnv } from '../src/auth/require-auth.js';
import { createVerifier, InvalidTokenError } from '../src/auth/verify.js';

const TOKEN = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1MSJ9.c2ln';
const ISSUER = 'http://127.0.0.1:54321/auth/v1';
const AUDIENCE = 'authenticated';

const jwksServers: Server[] = [];

async function jwksUrl(
  handler: (request: IncomingMessage, response: ServerResponse) => void,
): Promise<URL> {
  const server = createServer(handler);
  jwksServers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('test server has no TCP address');
  return new URL(`http://127.0.0.1:${address.port}/.well-known/jwks.json`);
}

function unavailableJwksUrl(): Promise<URL> {
  return jwksUrl((_request, response) => {
    response.writeHead(503).end();
  });
}

function droppedJwksUrl(): Promise<URL> {
  return jwksUrl((request) => {
    request.socket.destroy();
  });
}

afterEach(async () => {
  await Promise.all(
    jwksServers
      .splice(0)
      .map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
  );
});

function appWith(verify: Parameters<typeof createRequireAuth>[0]) {
  const app = new Hono<AuthEnv>();
  app.use('/protected', createRequireAuth(verify));
  app.get('/protected', (c) =>
    c.json({ userId: c.get('userId'), accessToken: c.get('accessToken') }),
  );
  return app;
}

const ok = appWith(async () => ({ sub: 'user-1', sessionId: 'sess-1' }));

describe('requireAuth', () => {
  it('returns 401 when the header is missing', async () => {
    const res = await ok.request('/protected');
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Missing or malformed Authorization header' },
    });
  });

  it('returns 401 when the header is malformed', async () => {
    const res = await ok.request('/protected', { headers: { Authorization: 'Basic abc' } });
    expect(res.status).toBe(401);
  });

  it('returns 401 when verification reports an invalid token', async () => {
    const app = appWith(async () => {
      throw new InvalidTokenError('bad signature');
    });
    const res = await app.request('/protected', { headers: { Authorization: `Bearer ${TOKEN}` } });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' },
    });
  });

  it('returns 503 when the JWKS service is temporarily unavailable', async () => {
    const app = appWith(
      createVerifier({
        jwksUrl: await unavailableJwksUrl(),
        issuer: ISSUER,
        audience: AUDIENCE,
      }),
    );

    const res = await app.request('/protected', { headers: { Authorization: `Bearer ${TOKEN}` } });

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      error: { code: 'INTERNAL', message: 'Authentication temporarily unavailable' },
    });
  });

  it('returns 503 when the JWKS connection fails', async () => {
    const app = appWith(
      createVerifier({
        jwksUrl: await droppedJwksUrl(),
        issuer: ISSUER,
        audience: AUDIENCE,
      }),
    );

    const res = await app.request('/protected', { headers: { Authorization: `Bearer ${TOKEN}` } });

    expect(res.status).toBe(503);
  });

  it('returns 500 when verification fails unexpectedly', async () => {
    const app = new Hono<AuthEnv>();
    app.onError((_error, c) => c.text('boom', 500));
    app.use(
      '/protected',
      createRequireAuth(async () => {
        throw new Error('unexpected verifier failure');
      }),
    );
    app.get('/protected', (c) => c.json({ ok: true }));

    const res = await app.request('/protected', { headers: { Authorization: `Bearer ${TOKEN}` } });

    expect(res.status).toBe(500);
  });

  it('passes the userId and access token downstream', async () => {
    const res = await ok.request('/protected', { headers: { Authorization: `Bearer ${TOKEN}` } });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ userId: 'user-1', accessToken: TOKEN });
  });

  it('does not turn downstream errors into 401', async () => {
    const app = new Hono<AuthEnv>();
    app.use(
      '/protected',
      createRequireAuth(async () => ({ sub: 'user-1', sessionId: undefined })),
    );
    app.onError((_error, c) => c.text('boom', 500));
    app.get('/protected', () => {
      throw new Error('route failed');
    });

    const res = await app.request('/protected', { headers: { Authorization: `Bearer ${TOKEN}` } });

    expect(res.status).toBe(500);
  });
});
