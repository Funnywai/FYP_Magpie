import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { createRequireAuth, type AuthEnv } from '../src/auth/require-auth.js';

const TOKEN = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1MSJ9.c2ln';

function appWith(verify: Parameters<typeof createRequireAuth>[0]) {
  const app = new Hono<AuthEnv>();
  app.use('/protected', createRequireAuth(verify));
  app.get('/protected', (c) => c.json({ userId: c.get('userId'), accessToken: c.get('accessToken') }));
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

  it('returns 401 when verification throws', async () => {
    const app = appWith(async () => {
      throw new Error('bad signature');
    });
    const res = await app.request('/protected', { headers: { Authorization: `Bearer ${TOKEN}` } });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' },
    });
  });

  it('passes the userId and access token downstream', async () => {
    const res = await ok.request('/protected', { headers: { Authorization: `Bearer ${TOKEN}` } });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ userId: 'user-1', accessToken: TOKEN });
  });

  it('does not turn downstream errors into 401', async () => {
    const app = new Hono<AuthEnv>();
    app.use('/protected', createRequireAuth(async () => ({ sub: 'user-1', sessionId: undefined })));
    app.onError((_error, c) => c.text('boom', 500));
    app.get('/protected', () => {
      throw new Error('route failed');
    });

    const res = await app.request('/protected', { headers: { Authorization: `Bearer ${TOKEN}` } });

    expect(res.status).toBe(500);
  });
});
