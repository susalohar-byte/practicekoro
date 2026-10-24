/**
 * Auth policy — production configuration.
 *
 * Admin accounts are created exclusively through direct database operations,
 * never through the public registration UI.  The ADMIN_EMAILS list is used
 * server-side (inside Supabase RPC / resolveUserProfile) for auto-promotion;
 * it is NOT used as a client-side trust boundary.
 */

const configuredAdminEmails: string[] =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_EMAILS
    ? (import.meta.env.VITE_ADMIN_EMAILS as string)
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    : [];

export const ADMIN_EMAILS: string[] = Array.from(
  new Set(['admin@practicekoro.online', ...configuredAdminEmails])
);

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};
