/**
 * Small global toast for the admin panel. `toast('Saved')` shows a message in the corner
 * instead of a blocking browser alert. `ToastHost` (mounted in AdminLayout) renders them.
 */
export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

type Listener = (item: ToastItem) => void;

const listeners = new Set<Listener>();
let nextId = 1;

const ERROR_RE =
  /fail|could not|cannot|can't|not saved|not published|error|denied|permission|invalid|please |unavailable/i;
const SUCCESS_RE = /success|saved|updated|deleted|restored|archived|duplicated|re-evaluated/i;

/** Error for messages that read like a failure, success for ones that confirm, else info. */
export function inferToastKind(message: string): ToastKind {
  if (ERROR_RE.test(message)) return 'error';
  if (SUCCESS_RE.test(message)) return 'success';
  return 'info';
}

/** Shows a toast. With no host on the page the message falls back to a browser alert. */
export function toast(message: string, kind: ToastKind = inferToastKind(message)): void {
  if (listeners.size === 0) {
    if (typeof window !== 'undefined') window.alert(message);
    return;
  }
  const item: ToastItem = { id: nextId++, message, kind };
  listeners.forEach((listener) => listener(item));
}

/** Used by ToastHost. Returns the unsubscribe function. */
export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
