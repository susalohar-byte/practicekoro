import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { AdminSettingsState } from '../useAdminSettings';

export interface DangerZoneCardProps {
  settings: AdminSettingsState;
}

export function DangerZoneCard({ settings }: DangerZoneCardProps) {
  const { canManageSettings, isSaving, setShowClearCacheModal } = settings;
  return (
    <>
      {/* Card 5: Danger Zone */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center gap-3 pb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-600 dark:text-rose-400 leading-tight">
              Danger Zone
            </h2>
            <p className="text-xs text-rose-500/80 dark:text-rose-400/80 mt-0.5">
              These actions are irreversible. Please be careful.
            </p>
          </div>
        </div>

        {/* Action Box: Clear Cache */}
        <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/50 rounded-xl p-3.5 flex items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-4.5 h-4.5 text-rose-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                Clear Cache
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Clear local offline cache only; never sign-in sessions or server caches
              </p>
            </div>
          </div>

          <button
            disabled={!canManageSettings || isSaving}
            type="button"
            onClick={() => setShowClearCacheModal(true)}
            className="px-4 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </>
  );
}
