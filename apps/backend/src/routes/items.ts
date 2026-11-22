import type { ListItemsResponse } from '@magpie/shared';
import { Hono, type MiddlewareHandler } from 'hono';

import type { AuthEnv } from '../auth/require-auth.js';
import { requireAuth } from '../auth/require-auth.js';
import { listItemsForUser, type ItemsPage } from '../db/items.js';
import { mapDataApiError } from '../errors.js';

export interface ItemsDeps {
  requireAuth: MiddlewareHandler<AuthEnv>;
  listItems: (accessToken: string) => Promise<ItemsPage>;
}

export function createItemsRoutes(deps: ItemsDeps) {
  const routes = new Hono<AuthEnv>();

  routes.use('*', deps.requireAuth);

  routes.get('/', async (c) => {
    try {
      const { items, hasMore } = await deps.listItems(c.get('accessToken'));
      const body: ListItemsResponse = { items, hasMore, nextCursor: null };
      return c.json(body);
    } catch (error) {
      const upstream = error as { code?: string; message?: string };
      console.error('[items] query failed:', upstream.code, upstream.message);
      const mapped = mapDataApiError(upstream);
      return c.json(mapped.body, mapped.status);
    }
  });

  return routes;
}

export const itemsRoutes = createItemsRoutes({ requireAuth, listItems: listItemsForUser });
