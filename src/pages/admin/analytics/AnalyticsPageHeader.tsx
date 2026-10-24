import { Download, Calendar } from 'lucide-react';
import type { DateRangePreset } from '@/types';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface AnalyticsPageHeaderProps {
  analyticsState: AdminAnalyticsState;
}

export function AnalyticsPageHeader({ analyticsState }: AnalyticsPageHeaderProps) {
  const {
    preset,
    setPreset,
    start,
    setStart,
    end,
    setEnd,
    data,
    loading,
    error,
    loadedPeriod,
    period,
    download,
  } = analyticsState;
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Analytics &amp; Insights
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Understand your students, content performance, subscriptions and growth.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Date Range Selector Pill */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <select
            aria-label="Reporting period"
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
            value={preset}
            onChange={(e) => setPreset(e.target.value as DateRangePreset)}
          >
            <option value="30d">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="this_year">This Year</option>
            <option value="all_time">All Time</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Inputs if active */}
        {preset === 'custom' && (
          <div className="flex items-center gap-2 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1 text-xs">
            <label className="text-[11px] text-slate-500">
              Start:
              <input
                aria-label="Start date"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="ml-1 bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            </label>
            <span className="text-slate-300">→</span>
            <label className="text-[11px] text-slate-500">
              End:
              <input
                aria-label="End date"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="ml-1 bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            </label>
          </div>
        )}

        {/* Export Report Button */}
        <button
          type="button"
          disabled={!data || loading || !!error || loadedPeriod !== period}
          onClick={download}
          className="bg-white dark:bg-[#0B132B] border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Report</span>
        </button>
      </div>
    </header>
  );
}
