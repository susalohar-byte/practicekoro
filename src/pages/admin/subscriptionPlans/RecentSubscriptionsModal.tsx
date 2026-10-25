import { X, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface RecentSubscriptionsModalProps {
  plansState: AdminSubscriptionPlansState;
}

export function RecentSubscriptionsModal({ plansState }: RecentSubscriptionsModalProps) {
  const { isViewAllRecentOpen, setIsViewAllRecentOpen, recentSubscriptions } = plansState;

  return (
    <>
      {/* ==================================================================== */}
      {/* 8. VIEW ALL RECENT SUBSCRIPTIONS MODAL                                */}
      {/* ==================================================================== */}
      {isViewAllRecentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  All Recent Subscriptions
                </h3>
                <p className="text-[11px] text-slate-400">
                  {recentSubscriptions.length} total transaction records
                </p>
              </div>
              <button
                onClick={() => setIsViewAllRecentOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {recentSubscriptions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No Subscriptions Found
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    When students purchase subscription plans, records will be listed here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {recentSubscriptions.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.studentAvatar}
                          alt={item.studentName}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.studentName)}&background=0284c7&color=fff`;
                          }}
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.studentName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.studentEmail ? `${item.studentEmail} • ` : ''}
                            {item.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-medium',
                            item.planBadgeClass
                          )}
                        >
                          {item.plan}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{item.amount}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
