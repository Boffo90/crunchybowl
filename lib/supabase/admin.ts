import { createClient } from '@supabase/supabase-js';

// Solo usar en server actions / API routes con el service role key
export function createAdminClient() {
  return createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { autoRefreshToken: false, persistSession: false } }
  );
}
