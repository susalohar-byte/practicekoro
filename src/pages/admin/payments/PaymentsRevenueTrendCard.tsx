import { Calendar, ChevronDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminMoneyChart } from '@/components/admin/AdminMoneyChart';
import { getKolkataDateString } from '@/services/domains/admin.dashboard';
import type { AdminPaymentsState } from './useAdminPayments';

export interface PaymentsRevenueTrendCardProps {
  pay: AdminPaymentsState;
}

export function PaymentsRevenueTrendCard({ pay }: PaymentsRevenueTrendCardProps) {
  const {
    timeRange,
    setTimeRange,
    attributionMode,
    setAttributionMode,
    range,
    chartPoints,
    cashFlowStats,
  } = pay;
  return (
    <>
      {/* Left: Revenue Trend */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
        {/* Card Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Revenue Trend</span>
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Income velocity & refund reconciliation
              </p>
            </div>
          </div>

          {/* Legend & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Legend Badges */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#026BFC] shadow-2xs" />
                <span>Retained revenue</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] shadow-2xs" />
                <span>Refunded</span>
              </div>
            </div>

            {/* Attribution Mode Switcher */}
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800/80 text-[11px]">
              <button
                type="button"
                aria-label="Accrual attribution mode"
                onClick={() => setAttributionMode('accrual')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer',
                  attributionMode === 'accrual'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                Payment Date (Accrual)
              </button>
              <button
                type="button"
                aria-label="Cash flow attribution mode"
                onClick={() => setAttributionMode('cashflow')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer',
                  attributionMode === 'cashflow'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                Refund Date (Cash Flow)
              </button>
            </div>

            {/* Time Filter */}
            <div className="relative">
              <select
                aria-label="Payment reporting period"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 90 Days">Last 90 Days</option>
                <option value="This Year">This Year</option>
                <option value="All Time">All Time</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Time Range & Context Ribbon */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <p className="truncate">
              {getKolkataDateString(new Date(range.startIso))} to{' '}
              {getKolkataDateString(new Date(range.endIso))} · Asia/Kolkata.{' '}
              {attributionMode === 'accrual'
                ? 'Refunds are attributed to the original payment date, not refund cash-flow date.'
                : `Cash flow mode: Refunds are attributed to actual refund settlement date (${cashFlowStats.refundCount} refund${cashFlowStats.refundCount === 1 ? '' : 's'} totalling ₹${cashFlowStats.refundOutflow.toLocaleString('en-IN')}).`}
            </p>
          </div>

          {attributionMode === 'cashflow' && (
            <div className="mt-2.5 p-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900 border border-blue-100/80 dark:border-blue-900/40 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex flex-col">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Gross Inflow:
                </span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  ₹{cashFlowStats.grossInflow.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Disbursed Refunds:
                </span>{' '}
                <span className="font-semibold text-rose-600 dark:text-rose-400 text-sm">
                  -₹{cashFlowStats.refundOutflow.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Net Cash Flow:
                </span>{' '}
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  ₹{cashFlowStats.netCashFlow.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chart Component */}
        <AdminMoneyChart points={chartPoints} />
      </div>
    </>
  );
}
