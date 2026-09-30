import type { ListItemsResponse } from '@magpie/shared';
import { Hono } from 'hono';

/**
 * GET /api/items — stub.
 *
 * Returns an empty list. This exists to prove the routing + shared-type
 * wiring compiles. Auth (401 without a JWT) lands in Step 2.
 */
export const itemsRoutes = new Hono();

itemsRoutes.get('/', (c) => {
  const body: ListItemsResponse = { items: [], nextCursor: null };
  return c.json(body);
});
