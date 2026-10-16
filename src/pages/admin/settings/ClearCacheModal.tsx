import { AlertTriangle } from 'lucide-react';
import type { AdminSettingsState } from './useAdminSettings';

export interface ClearCacheModalProps {
  settings: AdminSettingsState;
}

export function ClearCacheModal({ settings }: ClearCacheModalProps) {
  const {
    showClearCacheModal,
    canManageSettings,
    isSaving,
    setShowClearCacheModal,
    handleConfirmClearCache,
    isClearingCache,
  } = settings;
  return (
    <>
      {showClearCacheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Clear Local Admin Cache?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to clear your local admin browser cache?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              This action clears the named local offline cache only. Sign-in sessions and other
              browser storage are preserved. It does not delete or modify database records or affect
              student data on the server.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                disabled={!canManageSettings || isSaving}
                type="button"
                onClick={() => setShowClearCacheModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCache}
                disabled={!canManageSettings || isSaving || isClearingCache}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isClearingCache ? 'Clearing...' : 'Yes, Clear Cache'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
