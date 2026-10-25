import { cn } from '@/lib/utils';
import { CreditCard } from 'lucide-react';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface RecentSubscriptionsCardProps {
  plansState: AdminSubscriptionPlansState;
}

export function RecentSubscriptionsCard({ plansState }: RecentSubscriptionsCardProps) {
  const { recentSubscriptions, setIsViewAllRecentOpen } = plansState;
  const displaySubs = recentSubscriptions.slice(0, 5);

  return (
    <>
      {/* COL 3 (4 COLS): RECENT SUBSCRIPTIONS TABLE */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Subscriptions</h3>
              <p className="text-[11px] text-slate-400">Live student transactions</p>
            </div>
            {recentSubscriptions.length > 0 && (
              <button
                onClick={() => setIsViewAllRecentOpen(true)}
                className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline cursor-pointer"
              >
                View All ({recentSubscriptions.length})
              </button>
            )}
          </div>

          {displaySubs.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No Subscriptions Recorded Yet
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Live student subscriptions from the database will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-2 w-6 text-center">#</th>
                    <th className="py-2.5 px-2">Student</th>
                    <th className="py-2.5 px-2">Plan</th>
                    <th className="py-2.5 px-2">Amount</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
                  {displaySubs.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-2 text-center text-slate-400 font-normal">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={sub.studentAvatar}
                            alt={sub.studentName}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.studentName)}&background=0284c7&color=fff`;
                            }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
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
                      <td className="py-2.5 px-2 font-semibold text-slate-800 dark:text-slate-200">
                        ₹{sub.amount}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        {sub.date}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-400">
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
