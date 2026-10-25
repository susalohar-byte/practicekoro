/**
 * Where the Student Web Panel (student-web/) is served. In production it lives at
 * practicekoro.online/dashboard/ and shares the login session with this app (same origin);
 * in local development it runs on its own Vite server, so students sign in there again.
 * Override with VITE_STUDENT_PANEL_URL (must end with "/").
 */
const configured = (import.meta.env.VITE_STUDENT_PANEL_URL as string | undefined)?.trim();

export const STUDENT_PANEL_URL = (
  configured || (import.meta.env.DEV ? 'http://localhost:5173/' : '/dashboard/')
).replace(/\/?$/, '/');

/** A page of the student panel, e.g. studentPanelUrl('home'). */
export const studentPanelUrl = (path = 'home') => `${STUDENT_PANEL_URL}${path.replace(/^\//, '')}`;

/** Leaves this app for the student panel (a separate app, so a full page load). */
export function openStudentPanel(path = 'home'): void {
  window.location.replace(studentPanelUrl(path));
}
