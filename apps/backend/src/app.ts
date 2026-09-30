import type { HealthResponse } from '@magpie/shared';
import { Hono } from 'hono';

import { itemsRoutes } from './routes/items.js';

/**
 * Backend skeleton (docs/SPEC.md §5).
 *
 * Step 1: routing and type wiring only. No authentication, no AI providers.
 * Auth enforcement is Step 2.
 */
export const app = new Hono();

app.get('/api/health', (c) => {
  const body: HealthResponse = { status: 'ok' };
  return c.json(body);
});

app.route('/api/items', itemsRoutes);
