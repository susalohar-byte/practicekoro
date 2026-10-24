import { Server } from 'lucide-react';
import type { AdminSettingsState } from './useAdminSettings';

export interface SystemSettingsTabProps {
  settings: AdminSettingsState;
}

export function SystemSettingsTab({ settings }: SystemSettingsTabProps) {
  const { activeTab, appVersion } = settings;
  return (
    <>
      {activeTab === 'system' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                System Diagnostics & Maintenance
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Database statistics, platform version, and runtime status.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Platform Version</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{appVersion}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Database Engine</p>
              <p className="text-lg font-black text-blue-600 mt-1">Managed by Supabase</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Server Status</p>
              <p className="text-lg font-black text-emerald-600 mt-1">Not monitored here</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Storage Buckets</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Not monitored here
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
