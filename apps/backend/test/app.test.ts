import { describe, expect, it } from 'vitest';

import { app } from '../src/app.js';

describe('GET /api/health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const res = await app.request('/api/health');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: 'ok' });
  });
});

describe('GET /api/items', () => {
  it('returns an empty list (stub — auth is Step 2)', async () => {
    const res = await app.request('/api/items');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ items: [], nextCursor: null });
  });
});
