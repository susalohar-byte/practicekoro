export const DEFAULT_SUPABASE_URL = 'https://prycanbnxuihxhskallw.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWNhbmJueHVpaHhoc2thbGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTY1NTgsImV4cCI6MjEwNDg5MjU1OH0.HOzUGuRqD0Y9qWlGGhvHGenylTJ2Sky_G7E3PEO0EIw';

/**
 * Build-time environment gate. Validates Supabase connection settings.
 * Falls back to production defaults so remote builds (e.g. Cloudflare Pages,
 * Hostinger Git deployments) never render a broken error screen.
 */
export function isSupabaseEnvValid(env: {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}): boolean {
  const url = (env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL)?.trim();
  const key = (env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY)?.trim();
  return Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project-ref') &&
    !url.includes('placeholder')
  );
}
