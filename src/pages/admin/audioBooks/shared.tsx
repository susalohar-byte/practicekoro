import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Headphones, Loader2, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { youTubeThumbnailUrl } from '@/lib/youtube';

export interface ConfirmRequest {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  /** Info-only dialog (e.g. a blocked delete): hides the confirm button. */
  infoOnly?: boolean;
  onConfirm?: () => Promise<void> | void;
}

export const ConfirmDialog: React.FC<{ request: ConfirmRequest | null; onClose: () => void }> = ({
  request,
  onClose,
}) => {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  busyRef.current = busy;
  useEffect(() => {
    if (!request) return;
    setBusy(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, onClose]);
  if (!request) return null;
  const danger = request.tone !== 'primary';
  const confirm = async () => {
    if (!request.onConfirm) return onClose();
    setBusy(true);
    try {
      await request.onConfirm();
      onClose();
    } catch {
      // the caller reports the error; keep the dialog open for a retry
      setBusy(false);
    }
  };
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ab-confirm-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              danger
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50'
            )}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="ab-confirm-title"
              className="text-base font-bold text-slate-900 dark:text-white"
            >
              {request.title}
            </h2>
            <div className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {request.message}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {request.infoOnly ? 'OK' : 'Cancel'}
          </button>
          {!request.infoOnly && (
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60',
                danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#7C3AED] hover:bg-[#6D28D9]'
              )}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {request.confirmLabel ?? 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

export const Toast: React.FC<{ toast: ToastMessage | null; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, toast.type === 'error' ? 6000 : 3500);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);
  if (!toast) return null;
  const Icon = toast.type === 'success' ? CheckCircle2 : XCircle;
  return createPortal(
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={cn(
        'fixed bottom-5 right-5 z-[80] flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg',
        toast.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
          : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200'
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">{toast.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="opacity-60 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>,
    document.body
  );
};

/** Saved thumbnail -> YouTube still -> icon, advancing whenever an image fails to load. */
export const AudioBookThumb: React.FC<{
  src: string | null;
  videoId: string;
  alt: string;
  className?: string;
}> = ({ src, videoId, alt, className }) => {
  const sources = [src, youTubeThumbnailUrl(videoId)].filter(Boolean) as string[];
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [src, videoId]);
  const current = sources[index];
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-violet-100 text-blue-600 dark:from-blue-950 dark:to-violet-950',
        className
      )}
    >
      {current ? (
        <img
          src={current}
          alt={alt}
          loading="lazy"
          onError={() => setIndex((i) => i + 1)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Headphones className="h-5 w-5" aria-hidden="true" />
      )}
    </div>
  );
};

const CHIP_TONES = [
  'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
];

/** Stable colour per name so the same category always gets the same chip. */
export function chipTone(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return CHIP_TONES[hash % CHIP_TONES.length];
}

/** Subject badge styling exactly matching the UI reference screenshot */
export function getSubjectBadgeClass(name: string): string {
  const normalized = (name || '').toLowerCase().trim();
  if (normalized.includes('history')) {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
  }
  if (normalized.includes('geography')) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
  }
  if (normalized.includes('science')) {
    return 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300';
  }
  if (normalized.includes('polity')) {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
  }
  if (normalized.includes('math')) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
  }
  if (normalized.includes('bio')) {
    return 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300';
  }
  return chipTone(name);
}

export const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
