import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { createRequireAuth } from '../src/auth/require-auth.js';
import { createItemsRoutes } from '../src/routes/items.js';

const TOKEN = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1MSJ9.c2ln';
const requireAuth = createRequireAuth(async () => ({ sub: 'user-1', sessionId: 'sess-1' }));

function appWith(listItems: Parameters<typeof createItemsRoutes>[0]['listItems']) {
  const app = new Hono();
  app.route('/api/items', createItemsRoutes({ requireAuth, listItems }));
  return app;
}

describe('GET /api/items', () => {
  it('returns the items for the authenticated user and forwards their token', async () => {
    let receivedToken: string | null = null;
    const res = await appWith(async (accessToken) => {
      receivedToken = accessToken;
      return { items: [], hasMore: false };
    }).request('/api/items', {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ items: [], hasMore: false, nextCursor: null });
    expect(receivedToken).toBe(TOKEN);
  });

  it('requires authentication', async () => {
    const res = await appWith(async () => ({ items: [], hasMore: false })).request('/api/items');
    expect(res.status).toBe(401);
  });

  it('maps an upstream 401 to our envelope', async () => {
    const res = await appWith(async () => {
      throw Object.assign(new Error('JWT expired'), { code: 'PGRST301' });
    }).request('/api/items', { headers: { Authorization: `Bearer ${TOKEN}` } });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired session' },
    });
  });

  it('maps an unknown failure to 500 without leaking details', async () => {
    const res = await appWith(async () => {
      throw Object.assign(new Error('relation "saved_items" does not exist'), { code: '42P01' });
    }).request('/api/items', { headers: { Authorization: `Bearer ${TOKEN}` } });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: { code: 'INTERNAL', message: 'Something went wrong' },
    });
  });
});
