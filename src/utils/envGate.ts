/**
 * Supabase connection settings are baked in at build time from VITE_* env
 * vars (shell environment or `.env`). There is intentionally no fallback to
 * the production project: a build without settings must fail loudly rather
 * than silently talk to the live database.
 *
 * Demo mode (unit tests, Playwright E2E, local mock testing) never calls
 * Supabase, so it gets an inert local placeholder when settings are absent.
 */
export const DEMO_SUPABASE_URL = 'http://127.0.0.1:54321';
export const DEMO_SUPABASE_ANON_KEY = 'demo-mode-anon-key';

export interface SupabaseEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function isUsableUrl(url: string): boolean {
  return (
    url.startsWith('http') && !url.includes('your-project-ref') && !url.includes('placeholder')
  );
}

/**
 * Returns the Supabase settings to use, or `null` when they are missing or
 * still placeholders outside demo mode.
 */
export function resolveSupabaseConfig(env: SupabaseEnv, demoMode: boolean): SupabaseConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim() ?? '';
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

  if (url && anonKey && isUsableUrl(url)) return { url, anonKey };
  if (demoMode) return { url: DEMO_SUPABASE_URL, anonKey: DEMO_SUPABASE_ANON_KEY };
  return null;
}

export function isSupabaseEnvValid(env: SupabaseEnv, demoMode: boolean): boolean {
  return resolveSupabaseConfig(env, demoMode) !== null;
}
