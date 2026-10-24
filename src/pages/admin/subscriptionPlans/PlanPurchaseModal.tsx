import { Crown } from 'lucide-react';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface PlanPurchaseModalProps {
  plansState: AdminSubscriptionPlansState;
}

export function PlanPurchaseModal({ plansState }: PlanPurchaseModalProps) {
  const { selectedPlanForPurchase, setSelectedPlanForPurchase, showToast } = plansState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 9. PLAN DETAILS / ORDER MODAL                                        */}
      {/* ==================================================================== */}
      {selectedPlanForPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{selectedPlanForPurchase.name}</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedPlanForPurchase.subtitle}</p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-5">
              <span className="text-3xl font-bold text-slate-900">
                ₹{selectedPlanForPurchase.price}
              </span>
              <span className="text-xs text-slate-500 ml-1">
                / {selectedPlanForPurchase.durationDays} days
              </span>
            </div>

            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setSelectedPlanForPurchase(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast(`Selected ${selectedPlanForPurchase.name} tier.`);
                  setSelectedPlanForPurchase(null);
                }}
                className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              >
                Assign to Student
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
