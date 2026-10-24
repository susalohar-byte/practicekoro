import { X, CheckCircle2 } from 'lucide-react';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface ActiveSubscriptionsModalProps {
  plansState: AdminSubscriptionPlansState;
}

export function ActiveSubscriptionsModal({ plansState }: ActiveSubscriptionsModalProps) {
  const { isViewActiveModalOpen, setIsViewActiveModalOpen } = plansState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 7. VIEW ACTIVE SUBSCRIPTIONS MODAL                                    */}
      {/* ==================================================================== */}
      {isViewActiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Subscriptions Overview</h3>
                <p className="text-[11px] text-slate-500">
                  4,920 currently active learners across West Bengal
                </p>
              </div>
              <button
                onClick={() => setIsViewActiveModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Free Tier</span>
                  <span className="text-lg font-bold text-slate-900">12,450</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-600 block font-medium">Basic Plan</span>
                  <span className="text-lg font-bold text-blue-900">2,840</span>
                </div>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-600 block font-medium">Pro Plan</span>
                  <span className="text-lg font-bold text-amber-900">1,460</span>
                </div>
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-600 block font-medium">Ultimate</span>
                  <span className="text-lg font-bold text-purple-900">620</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Renewal automated collection rate is 94.2% via Razorpay & UPI Autopay.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsViewActiveModalOpen(false)}
                  className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800"
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
