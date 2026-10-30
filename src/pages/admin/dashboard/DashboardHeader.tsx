import { invalidateApiCache } from '@/services/apiCache';
import { RefreshCw, Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminDashboardState } from './useAdminDashboard';

export interface DashboardHeaderProps {
  db: AdminDashboardState;
}

export function DashboardHeader({ db }: DashboardHeaderProps) {
  const {
    isStale,
    isLoading,
    loadPlatformData,
    isDateOpen,
    setIsDateOpen,
    dateBounds,
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          {isStale && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Stale Data
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
          Overview of your PracticeKoro platform
        </p>
      </div>

      {/* Date Range Selector Pill & Reload */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            invalidateApiCache();
            loadPlatformData();
          }}
          disabled={isLoading}
          title="Refresh Platform Data"
          className="p-2 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>

        <div className="relative shrink-0">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{dateBounds.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isDateOpen && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 shadow-lg p-2 z-40 text-xs font-medium animate-in fade-in slide-in-from-top-1">
              {[
                'Last 7 Days',
                'Last 14 Days',
                'Last 30 Days',
                'This Month',
                'This Quarter',
                'All Time',
                'Custom Range',
              ].map((range) => (
                <button
                  key={range}
                  onClick={() => handleSelectPreset(range)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg transition-colors',
                    dateRangePreset === range
                      ? 'bg-[#026BFC] text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  {range}
                </button>
              ))}

              {showCustomInputs && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-500">Select Date Interval:</p>
                  <div className="space-y-1">
                    <input
                      type="date"
                      aria-label="Report start date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                    />
                    <input
                      type="date"
                      aria-label="Report end date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                    />
                  </div>
                  <button
                    onClick={handleApplyCustomDate}
                    className="w-full py-1.5 rounded-lg bg-[#026BFC] text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                  >
                    Apply Date Filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
