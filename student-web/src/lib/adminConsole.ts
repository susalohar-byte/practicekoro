import { supabase } from '@/lib/supabase';

/**
 * The admin console's address: /admin on practicekoro.online (same origin, shared login);
 * in local development it is the admin app's own Vite server. Override with VITE_ADMIN_URL.
 */
export const ADMIN_CONSOLE_URL =
  import.meta.env.VITE_ADMIN_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:5174/admin' : '/admin');

/**
 * Same rule as the admin console (AuthContext.resolveUserProfile): an active profile with
 * role 'admin', a staff admin_role and an 'admin' row in user_roles. The console checks it
 * again on arrival; this only decides where a fresh sign-in is sent.
 */
export async function isAdminAccount(userId: string): Promise<boolean> {
  const [profile, roles] = await Promise.all([
    supabase.from('profiles').select('role, admin_role, account_status').eq('id', userId).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', userId),
  ]);
  const p = profile.data as { role?: string; admin_role?: string; account_status?: string } | null;
  if (!p || p.role !== 'admin' || p.account_status !== 'active') return false;
  if (!['super_admin', 'content_writer', 'support_agent'].includes(p.admin_role ?? '')) return false;
  return (roles.data ?? []).some((r: { role: string }) => r.role === 'admin');
}
