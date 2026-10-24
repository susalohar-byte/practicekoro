import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

import { resolveSupabaseConfig } from '@/utils/envGate';

export const isDemoModeEnabled = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

// The anon key is the public client key intended for browsers; access is
// enforced by Row Level Security. Settings come only from VITE_* env vars.
const supabaseConfig = resolveSupabaseConfig(
  {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  },
  isDemoModeEnabled
);

if (!supabaseConfig) {
  throw new Error(
    'Supabase configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file (see .env.example).'
  );
}

const supabaseUrl = supabaseConfig.url;
const supabaseAnonKey = supabaseConfig.anonKey;

export const isSupabaseConfigured = !isDemoModeEnabled;

// Create client with active Supabase configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Central compatibility boundary until generated Database types are refreshed from Supabase.
export const supabaseRuntime = supabase as unknown as SupabaseClient;
