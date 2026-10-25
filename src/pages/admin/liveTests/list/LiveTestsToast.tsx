import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestsToastProps {
  live: AdminLiveTestsState;
}

export function LiveTestsToast({ live }: LiveTestsToastProps) {
  const { toastNotification } = live;
  return (
    <>
      {/* Toast Notification Alert */}
      {toastNotification && (
        <div
          className={cn(
            'fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2',
            toastNotification.type === 'success' &&
              'bg-emerald-50 text-emerald-800 border-emerald-200',
            toastNotification.type === 'error' && 'bg-rose-50 text-rose-800 border-rose-200',
            toastNotification.type === 'info' && 'bg-blue-50 text-blue-800 border-blue-200'
          )}
        >
          {toastNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastNotification.message}</span>
        </div>
      )}
    </>
  );
}
