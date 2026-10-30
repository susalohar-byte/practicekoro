import {
  DollarSign,
  Download,
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRevenueAnalyticsState } from './useAdminRevenueAnalytics';

export interface RevenueSectionProps {
  ra: AdminRevenueAnalyticsState;
}

export function RevenueSection({ ra }: RevenueSectionProps) {
  const {
    handleExportRevenueCsv,
    filteredPayments,
    isLoading,
    analyticsData,
    transactionSearch,
    setTransactionSearch,
    statusFilter,
    setStatusFilter,
  } = ra;
  return (
    <>
      {/* ─── SECTION 3: REVENUE ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue & Subscriptions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Net collections, active subscription passes, and payment transactions
              </p>
            </div>
          </div>

          <button
            onClick={handleExportRevenueCsv}
            disabled={filteredPayments.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Revenue 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Revenue
              </span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : !analyticsData
                  ? '—'
                  : `₹${(analyticsData?.revenue.totalRevenue ?? 0).toLocaleString('en-IN')}`}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Net revenue (selected range)</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Monthly Revenue
              </span>
              <Calendar className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : !analyticsData
                  ? '—'
                  : `₹${(analyticsData?.revenue.monthlyRevenue ?? 0).toLocaleString('en-IN')}`}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Net revenue, current calendar month</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Paid Students
              </span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : !analyticsData
                  ? '—'
                  : (analyticsData?.revenue.paidStudents ?? 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Converted Subscribers</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Subscriptions
              </span>
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {isLoading
                ? '...'
                : !analyticsData
                  ? '—'
                  : (analyticsData?.revenue.activeSubscriptions ?? 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Live Student Passes</p>
          </div>
        </div>

        {/* Revenue Trend Visualizer */}
        {analyticsData?.revenue.revenueTrend && analyticsData.revenue.revenueTrend.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Revenue Trend Over Time
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Selected Window</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
              {analyticsData.revenue.revenueTrend.map((pt, idx) => {
                const maxRev = Math.max(
                  100,
                  ...(analyticsData.revenue.revenueTrend.map((p) => p.amount) || [100])
                );
                const heightPct = Math.min(
                  100,
                  Math.max(10, Math.round((pt.amount / maxRev) * 100))
                );

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 text-center group">
                    <div className="h-24 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl p-1.5 flex flex-col justify-end items-center relative border border-slate-100 dark:border-slate-800/60">
                      <div className="absolute -top-9 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                        ₹{pt.amount.toLocaleString('en-IN')} ({pt.transactions} orders)
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-lg transition-all group-hover:brightness-110"
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate w-full">
                      {pt.label}
                    </div>
                    <div className="text-[10px] font-bold text-slate-900 dark:text-white -mt-1">
                      ₹{pt.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transactions Table Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Payment Transactions ({filteredPayments.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Order / ID</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Plan</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                      No payment records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.slice(0, 15).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {p.orderId || p.razorpayOrderId || p.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {p.studentName || 'Student Candidate'}
                        </div>
                        <div className="text-[10px] text-slate-400">{p.studentEmail}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                        {p.planTitle || 'Pro Subscription'}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                        ₹{p.amount}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold capitalize',
                            p.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : p.status === 'pending'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(p.createdAt || p.created_at || Date.now()).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
