import { createClient } from '@supabase/supabase-js';

// Same project and public (anon) key as the Flutter app and the admin console. The anon key
// is the browser key; every read and write is still checked by Row Level Security.
const DEFAULT_SUPABASE_URL = 'https://wzcmhowowoyeldfqzkeh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Y21ob3dvd295ZWxkZnF6a2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDE4OTMsImV4cCI6MjEwNjg3Nzg5M30.Z5N63dz47Y-JdygzP4b2pGNfiu7GR-fD7HbdwgFQQVs';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;

if (!url.startsWith('https://') || url.includes('your-project-ref')) {
  throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Default storage key on purpose: served at practicekoro.online/dashboard/, the panel shares the
    // session with the landing page and admin console, so one sign-in works across the site.
  },
});
