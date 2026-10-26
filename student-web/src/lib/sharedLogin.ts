/**
 * The site-wide login page: practicekoro.online/login, where admins and students sign in on one
 * page and the session is shared with this panel (same origin). In local development the admin
 * app runs on another origin, so the panel keeps its own login page. Override with
 * VITE_SHARED_LOGIN_URL; set it to an empty string to always use the panel's own page.
 */
const configured = import.meta.env.VITE_SHARED_LOGIN_URL;
export const SHARED_LOGIN_URL = (configured ?? (import.meta.env.DEV ? '' : '/login')).trim();

const BOUNCE_KEY = 'pk-shared-login-bounce';
const BOUNCE_WINDOW_MS = 15_000;

/**
 * Whether to leave for the shared login page. Not when we were just sent there: if the shared
 * page thinks we are signed in but this panel does not see the session, going back would loop,
 * so the panel's own login page is shown instead.
 */
export function shouldUseSharedLogin(): boolean {
  if (!SHARED_LOGIN_URL) return false;
  try {
    const last = Number(sessionStorage.getItem(BOUNCE_KEY));
    return !(last && Date.now() - last < BOUNCE_WINDOW_MS);
  } catch {
    return true;
  }
}

export function goToSharedLogin(): void {
  try {
    sessionStorage.setItem(BOUNCE_KEY, String(Date.now()));
  } catch {
    // Private mode: no loop guard, the redirect still works.
  }
  window.location.replace(SHARED_LOGIN_URL);
}
