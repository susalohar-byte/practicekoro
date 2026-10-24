import { Clock } from 'lucide-react';
import type { AdminSubscriptionsState } from './useAdminSubscriptions';

export interface ExtendSubscriptionModalProps {
  subscriptionsState: AdminSubscriptionsState;
}

export function ExtendSubscriptionModal({ subscriptionsState }: ExtendSubscriptionModalProps) {
  const {
    isExtendModalOpen,
    setIsExtendModalOpen,
    isSubmitting,
    selectedSubscription,
    handleExtendConfirm,
  } = subscriptionsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 6. EXTEND SUBSCRIPTION MODAL                                         */}
      {/* ==================================================================== */}
      {isExtendModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Extend Subscription</h3>
            <p className="text-xs text-slate-500 mb-4">
              Grant additional validity to <strong>{selectedSubscription.studentName}</strong>
            </p>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <button
                disabled={isSubmitting}
                onClick={() => handleExtendConfirm(30)}
                className="py-2.5 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                +30 Days
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => handleExtendConfirm(90)}
                className="py-2.5 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                +90 Days
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => handleExtendConfirm(180)}
                className="py-2.5 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                +180 Days
              </button>
            </div>

            <button
              onClick={() => setIsExtendModalOpen(false)}
              disabled={isSubmitting}
              className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
