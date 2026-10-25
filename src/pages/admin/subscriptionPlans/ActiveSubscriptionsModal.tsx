import { X, CheckCircle2 } from 'lucide-react';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface ActiveSubscriptionsModalProps {
  plansState: AdminSubscriptionPlansState;
}

export function ActiveSubscriptionsModal({ plansState }: ActiveSubscriptionsModalProps) {
  const {
    isViewActiveModalOpen,
    setIsViewActiveModalOpen,
    activeSubscriptionsCount,
    totalStudentsCount,
    freeStudentsCount,
    planSubscriberCounts,
    plans,
  } = plansState;

  const paidPlans = plans.filter((p) => p.price > 0);
  const activePercent =
    totalStudentsCount > 0
      ? Math.min(100, Math.round((activeSubscriptionsCount / totalStudentsCount) * 100))
      : 0;

  return (
    <>
      {/* ==================================================================== */}
      {/* 7. VIEW ACTIVE SUBSCRIPTIONS MODAL                                    */}
      {/* ==================================================================== */}
      {isViewActiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Subscriptions Overview
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activeSubscriptionsCount.toLocaleString('en-IN')} currently active learners
                  across platform
                </p>
              </div>
              <button
                onClick={() => setIsViewActiveModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-medium">Free Tier</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {freeStudentsCount.toLocaleString('en-IN')}
                  </span>
                </div>
                {paidPlans.map((p) => {
                  const count =
                    planSubscriberCounts[p.id] ??
                    planSubscriberCounts[p.name.toLowerCase()] ??
                    0;
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-blue-50/50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60"
                    >
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-medium truncate">
                        {p.name}
                      </span>
                      <span className="text-lg font-bold text-blue-900 dark:text-blue-200">
                        {count.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {activeSubscriptionsCount.toLocaleString('en-IN')} active subscriptions recorded out of{' '}
                    {totalStudentsCount.toLocaleString('en-IN')} total registered learners ({activePercent}% active paid rate).
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsViewActiveModalOpen(false)}
                  className="bg-slate-900 dark:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
