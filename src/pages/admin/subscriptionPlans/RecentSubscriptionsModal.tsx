import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatSubscriptionAmount,
  formatSubscriptionDate,
  subscriptionInitials,
  subscriptionStatusClass,
  subscriptionStatusLabel,
} from './recentSubscriptionFormat';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface RecentSubscriptionsModalProps {
  plansState: AdminSubscriptionPlansState;
}

export function RecentSubscriptionsModal({ plansState }: RecentSubscriptionsModalProps) {
  const {
    isViewAllRecentOpen,
    setIsViewAllRecentOpen,
    recentSubscriptions,
    recentSubscriptionsError,
  } = plansState;
  const rows = recentSubscriptions ?? [];
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
                {rows.length === 0 && (
                  <div className="py-6 text-center text-slate-400">
                    {recentSubscriptions === null
                      ? 'Loading recent subscriptions…'
                      : recentSubscriptionsError || 'No subscriptions yet.'}
                  </div>
                )}
                {rows.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.studentName}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {subscriptionInitials(item.studentName)}
                        </span>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900">{item.studentName}</div>
                        <div className="text-[11px] text-slate-400">
                          {formatSubscriptionDate(item.createdAt || item.startsAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium',
                          'bg-[#DBEAFE] text-[#1E40AF]'
                        )}
                      >
                        {item.planTitle}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatSubscriptionAmount(item)}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium',
                          subscriptionStatusClass(item.status)
                        )}
                      >
                        {subscriptionStatusLabel(item.status)}
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
