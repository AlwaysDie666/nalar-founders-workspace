import { createClient } from '@supabase/supabase-js';

// Lazy initialization — only throws when actually called, not at import time
let _admin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (_admin) return _admin;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY belum di-set di .env.local');
  }

  _admin = createClient(url, key);
  return _admin;
}
