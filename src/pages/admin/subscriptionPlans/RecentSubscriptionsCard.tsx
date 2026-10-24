import { cn } from '@/lib/utils';
import { RECENT_SUBSCRIPTIONS } from './subscriptionPlanData';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface RecentSubscriptionsCardProps {
  plansState: AdminSubscriptionPlansState;
}

export function RecentSubscriptionsCard({ plansState }: RecentSubscriptionsCardProps) {
  const { setIsViewAllRecentOpen } = plansState;
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
                {RECENT_SUBSCRIPTIONS.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-2 text-center text-slate-400 font-normal">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={sub.studentAvatar}
                          alt={sub.studentName}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <span className="font-semibold text-slate-800 truncate">
                          {sub.studentName}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded text-[10px] font-medium',
                          sub.planBadgeClass
                        )}
                      >
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-800">₹{sub.amount}</td>
                    <td className="py-2.5 px-2 text-slate-500 text-[11px] whitespace-nowrap">
                      {sub.date}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#DCFCE7] text-[#15803D]">
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
