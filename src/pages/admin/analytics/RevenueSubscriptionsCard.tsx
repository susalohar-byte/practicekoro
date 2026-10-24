import type { PlatformAnalyticsData } from '@/types';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface RevenueSubscriptionsCardProps {
  analyticsState: AdminAnalyticsState;
  data: PlatformAnalyticsData;
}

export function RevenueSubscriptionsCard({ analyticsState, data }: RevenueSubscriptionsCardProps) {
  const { card, retainedRevenueVal } = analyticsState;
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Revenue &amp; Subscriptions
        </h2>
        <div className="flex items-center gap-3 text-[11px]">
          <a href="/admin/subscriptions" className="text-blue-600 hover:underline">
            Manage Plans →
          </a>
          <a href="/admin/payments" className="text-blue-600 hover:underline">
            View Payments →
          </a>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
        {[
          {
            label: 'Net revenue (selected range)',
            value: `₹${retainedRevenueVal.toLocaleString('en-IN')}`,
          },
          {
            label: 'Net revenue, current month',
            value: `₹${(data.revenue?.monthlyRevenue ?? 0).toLocaleString('en-IN')}`,
          },
          {
            label: 'Distinct paying students',
            value: (data.revenue?.paidStudents ?? 0).toLocaleString('en-IN'),
          },
          {
            label: 'Active Pro students',
            value: (data.revenue?.activeSubscriptions ?? 0).toLocaleString('en-IN'),
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-slate-100 dark:border-slate-800 p-3"
          >
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {m.label}
            </p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
