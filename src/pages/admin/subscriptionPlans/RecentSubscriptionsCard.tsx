import { cn } from '@/lib/utils';
import {
  formatSubscriptionAmount,
  formatSubscriptionDate,
  subscriptionInitials,
  subscriptionStatusClass,
  subscriptionStatusLabel,
} from './recentSubscriptionFormat';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface RecentSubscriptionsCardProps {
  plansState: AdminSubscriptionPlansState;
}

export function RecentSubscriptionsCard({ plansState }: RecentSubscriptionsCardProps) {
  const { setIsViewAllRecentOpen, recentSubscriptions, recentSubscriptionsError } = plansState;
  const rows = (recentSubscriptions ?? []).slice(0, 5);
  const emptyMessage =
    recentSubscriptions === null
      ? 'Loading recent subscriptions…'
      : recentSubscriptionsError
        ? recentSubscriptionsError
        : 'No subscriptions yet.';
  return (
    <>
      {/* COL 3 (4 COLS): RECENT SUBSCRIPTIONS TABLE */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Subscriptions</h3>
            <button
              onClick={() => setIsViewAllRecentOpen(true)}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-2 w-6 text-center">#</th>
                  <th className="py-2.5 px-2">Student</th>
                  <th className="py-2.5 px-2">Plan</th>
                  <th className="py-2.5 px-2">Amount</th>
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {rows.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-2 text-center text-slate-400 font-normal">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        {sub.avatarUrl ? (
                          <img
                            src={sub.avatarUrl}
                            alt={sub.studentName}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold flex items-center justify-center shrink-0">
                            {subscriptionInitials(sub.studentName)}
                          </span>
                        )}
                        <span className="font-semibold text-slate-800 truncate">
                          {sub.studentName}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded text-[10px] font-medium',
                          'bg-[#DBEAFE] text-[#1E40AF]'
                        )}
                      >
                        {sub.planTitle}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-800">
                      {formatSubscriptionAmount(sub)}
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatSubscriptionDate(sub.createdAt || sub.startsAt)}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded text-[10px] font-medium',
                          subscriptionStatusClass(sub.status)
                        )}
                      >
                        {subscriptionStatusLabel(sub.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
