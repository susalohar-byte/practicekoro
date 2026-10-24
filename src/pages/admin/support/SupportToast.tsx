import { Check, X } from 'lucide-react';
import type { AdminSupportState } from './useAdminSupport';

export interface SupportToastProps {
  supportState: AdminSupportState;
}

export function SupportToast({ supportState }: SupportToastProps) {
  const { toastMessage, toastError } = supportState;
  return (
    <>
      {toastMessage && (
        <div
          role={toastError ? 'alert' : 'status'}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200"
        >
          {toastError ? (
            <X className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
