import { createClient } from '@supabase/supabase-js';

// Same project and public (anon) key as the Flutter app and the admin console. The anon key
// is the browser key; every read and write is still checked by Row Level Security.
const DEFAULT_SUPABASE_URL = 'https://prycanbnxuihxhskallw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWNhbmJueHVpaHhoc2thbGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTY1NTgsImV4cCI6MjEwNDg5MjU1OH0.HOzUGuRqD0Y9qWlGGhvHGenylTJ2Sky_G7E3PEO0EIw';

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
