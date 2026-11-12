import { serve } from '@hono/node-server';

import { app } from './app.js';
import { initAuth } from './auth/require-auth.js';

// Fail fast on missing auth config instead of returning 401 for every request.
initAuth();

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`backend listening on http://localhost:${info.port}`);
});
