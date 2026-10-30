import { IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminDashboardState } from './useAdminDashboard';

export interface DashboardDateRangePanelProps {
  db: AdminDashboardState;
}

export function DashboardDateRangePanel({ db }: DashboardDateRangePanelProps) {
  const {
    handleSelectPreset,
    dateRangePreset,
    showCustomInputs,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    handleApplyCustomDate,
  } = db;
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Revenue & Growth Analytics
            </h2>
            <p className="text-[11px] text-slate-500">
              Inspect net retained revenue, student registrations, and transactions by date
            </p>
          </div>
        </div>

        {/* Quick Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Custom Range'].map((btn) => (
            <button
              key={btn}
              onClick={() => handleSelectPreset(btn)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                dateRangePreset === btn
                  ? 'bg-[#026BFC] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Interval Input Fields */}
      {(showCustomInputs || dateRangePreset === 'Custom Range') && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Select Date Interval:
          </span>
          <input
            type="date"
            aria-label="Report start date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            aria-label="Report end date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          />
          <button
            onClick={handleApplyCustomDate}
            className="px-3 py-1 rounded-lg bg-[#026BFC] text-white font-bold hover:bg-blue-600 transition-colors"
          >
            Apply Date Filter
          </button>
        </div>
      )}
    </div>
  );
}
