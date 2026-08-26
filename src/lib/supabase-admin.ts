import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase service role key for admin operations');
}

// Admin client with service_role key - used only for admin operations (user creation/deletion)
// WARNING: This key bypasses RLS. Only use in AdminPage for COO-only operations.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
