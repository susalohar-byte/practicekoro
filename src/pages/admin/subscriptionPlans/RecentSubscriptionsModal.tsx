import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RECENT_SUBSCRIPTIONS } from './subscriptionPlanData';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface RecentSubscriptionsModalProps {
  plansState: AdminSubscriptionPlansState;
}

export function RecentSubscriptionsModal({ plansState }: RecentSubscriptionsModalProps) {
  const { isViewAllRecentOpen, setIsViewAllRecentOpen } = plansState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 8. VIEW ALL RECENT SUBSCRIPTIONS MODAL                                */}
      {/* ==================================================================== */}
      {isViewAllRecentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">All Recent Subscriptions</h3>
              <button
                onClick={() => setIsViewAllRecentOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="divide-y divide-slate-100 text-xs">
                {RECENT_SUBSCRIPTIONS.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.studentAvatar}
                        alt={item.studentName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{item.studentName}</div>
                        <div className="text-[11px] text-slate-400">{item.date}</div>
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
                      <span className="font-bold text-slate-900">₹{item.amount}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
