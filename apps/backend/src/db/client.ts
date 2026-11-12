import { createClient } from '@supabase/supabase-js';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

/**
 * A client scoped to one user's JWT. RLS applies because the request carries
 * the user's token, never the service-role key.
 */
export function createUserClient(accessToken: string) {
  return createClient(required('SUPABASE_URL'), required('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
