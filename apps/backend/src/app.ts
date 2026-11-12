import type { HealthResponse } from '@magpie/shared';
import { Hono } from 'hono';

import { apiError } from './errors.js';
import { itemsRoutes } from './routes/items.js';

export function registerErrorHandlers(app: Hono) {
  app.notFound((c) => c.json(apiError('NOT_FOUND', 'Route not found'), 404));
  app.onError((error, c) => {
    console.error('[app] unhandled error:', error instanceof Error ? error.message : error);
    return c.json(apiError('INTERNAL', 'Something went wrong'), 500);
  });
  return app;
}

export const app = registerErrorHandlers(new Hono());

app.get('/api/health', (c) => {
  const body: HealthResponse = { status: 'ok' };
  return c.json(body);
});

app.route('/api/items', itemsRoutes);
