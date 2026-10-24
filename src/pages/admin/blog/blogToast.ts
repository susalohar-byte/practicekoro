export type ToastType = 'success' | 'error' | 'info';
let globalToastHandler: ((msg: string, type: ToastType) => void) | null = null;

export function setGlobalToastHandler(handler: ((msg: string, type: ToastType) => void) | null) {
  globalToastHandler = handler;
}

export const toast = {
  success: (msg: string) => globalToastHandler?.(msg, 'success'),
  error: (msg: string) => globalToastHandler?.(msg, 'error'),
  info: (msg: string) => globalToastHandler?.(msg, 'info'),
};
