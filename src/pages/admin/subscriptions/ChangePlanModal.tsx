import { Crown } from 'lucide-react';
import type { AdminSubscriptionsState } from './useAdminSubscriptions';

export interface ChangePlanModalProps {
  subscriptionsState: AdminSubscriptionsState;
}

export function ChangePlanModal({ subscriptionsState }: ChangePlanModalProps) {
  const {
    isChangePlanModalOpen,
    setIsChangePlanModalOpen,
    changePlanStart,
    setChangePlanStart,
    availablePlans,
    isSubmitting,
    selectedSubscription,
    handleChangePlanConfirm,
  } = subscriptionsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 7. CHANGE PLAN MODAL                                                 */}
      {/* ==================================================================== */}
      {isChangePlanModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Change Tier Plan</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select upgraded subscription tier for{' '}
              <strong>{selectedSubscription.studentName}</strong>
            </p>

            <div
              role="radiogroup"
              aria-label="New plan period"
              className="grid grid-cols-2 gap-1 p-1 mb-3 rounded-xl bg-slate-100 text-[11px] font-semibold"
            >
              {(
                [
                  ['today', 'Start today'],
                  ['stack', 'Add to remaining time'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={changePlanStart === value}
                  disabled={isSubmitting}
                  onClick={() => setChangePlanStart(value)}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    changePlanStart === value
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 mb-5 text-left text-xs">
              {availablePlans.length === 0 ? (
                <div className="p-3 text-center text-slate-400">No active plans available</div>
              ) : (
                availablePlans.map((plan) => {
                  const duration = plan.durationDays || 30;
                  // Mirrors changeSubscriptionPlan: stacking only applies while time remains.
                  const currentExpiry = Date.parse(selectedSubscription.expiresAtIso || '');
                  const base =
                    changePlanStart === 'stack' &&
                    Number.isFinite(currentExpiry) &&
                    currentExpiry > Date.now()
                      ? new Date(currentExpiry)
                      : new Date();
                  base.setDate(base.getDate() + duration);
                  const futureDate = base.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <button
                      key={plan.id}
                      disabled={isSubmitting}
                      onClick={() => handleChangePlanConfirm(plan)}
                      className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between font-medium text-slate-800 transition-colors cursor-pointer disabled:opacity-50 text-left"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{plan.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {duration} days validity • New expiry: {futureDate}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-blue-600 text-sm">₹{plan.price}</span>
                        <div className="text-[10px] text-slate-400">Apply</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setIsChangePlanModalOpen(false)}
              disabled={isSubmitting}
              className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
