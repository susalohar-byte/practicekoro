import { Shield } from 'lucide-react';
import type { AdminSettingsState } from './useAdminSettings';

export interface SecuritySettingsTabProps {
  settings: AdminSettingsState;
}

export function SecuritySettingsTab({ settings }: SecuritySettingsTabProps) {
  const { activeTab } = settings;
  return (
    <>
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Platform Security & Access Protection
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Auth protections must be configured server-side. These controls do not enforce
                policies.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Session Timeout (Minutes)
              </label>
              <input
                aria-label="Session Timeout (Minutes)"
                type="number"
                disabled
                placeholder="Managed by Supabase Auth"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Max Failed Login Attempts
              </label>
              <input
                aria-label="Max Failed Login Attempts"
                type="number"
                disabled
                placeholder="Managed by Supabase Auth"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled
              title="Auth policies must be configured server-side"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Update Security Policies
            </button>
          </div>
        </div>
      )}
    </>
  );
}
