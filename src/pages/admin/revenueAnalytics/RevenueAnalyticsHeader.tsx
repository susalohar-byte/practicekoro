import { BarChart3, RefreshCw, Trophy, CreditCard, Tag, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { presetOptions } from './revenueAnalyticsUtils';
import type { AdminRevenueAnalyticsState } from './useAdminRevenueAnalytics';

export interface RevenueAnalyticsHeaderProps {
  ra: AdminRevenueAnalyticsState;
}

export function RevenueAnalyticsHeader({ ra }: RevenueAnalyticsHeaderProps) {
  const {
    handleRefresh,
    isLoading,
    isRefreshing,
    setIsRankModalOpen,
    loadError,
    preset,
    setPreset,
    handleApplyCustomRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
  } = ra;
  return (
    <>
      {/* ─── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <span>Analytics & Reports</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Platform Intelligence
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Student Performance, Question Insights & Financial Analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={cn('w-4 h-4', (isLoading || isRefreshing) && 'animate-spin')} />
          </button>
          <button
            onClick={() => setIsRankModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>Student Leaderboard</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-2xl p-4 border border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between"
        >
          <div>
            <span className="font-bold mr-1">Analytics unavailable:</span> {loadError}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold inline-flex items-center gap-1 text-xs shadow-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs across Subscriptions, Coupons, Revenue */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <Link
          to="/admin/subscriptions"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <CreditCard className="w-4 h-4 text-indigo-500" />
          <span>Subscriptions & Aspirants</span>
        </Link>
        <Link
          to="/admin/coupons"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Tag className="w-4 h-4 text-amber-500" />
          <span>Coupons & Discounts</span>
        </Link>
        <Link
          to="/admin/revenue-analytics"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white shadow-xs"
        >
          <TrendingUp className="w-4 h-4 text-emerald-300" />
          <span>Revenue Analytics & Ledger</span>
        </Link>
      </div>

      {/* ─── Date Range Selector Bar ────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Filter Timeframe:</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {presetOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPreset(opt.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                preset === opt.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <form
            onSubmit={handleApplyCustomRange}
            className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800"
          >
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500"
            >
              Apply
            </button>
          </form>
        )}
      </div>
    </>
  );
}
