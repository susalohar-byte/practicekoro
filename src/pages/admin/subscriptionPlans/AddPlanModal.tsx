import { Plus, X } from 'lucide-react';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface AddPlanModalProps {
  plansState: AdminSubscriptionPlansState;
}

export function AddPlanModal({ plansState }: AddPlanModalProps) {
  const {
    isAddPlanModalOpen,
    setIsAddPlanModalOpen,
    handleSavePlan,
    formPlanName,
    setFormPlanName,
    formPlanSubtitle,
    setFormPlanSubtitle,
    formPlanPrice,
    setFormPlanPrice,
    formPlanOriginalPrice,
    setFormPlanOriginalPrice,
    formPlanDurationDays,
    setFormPlanDurationDays,
    formPlanRenewalWindow,
    setFormPlanRenewalWindow,
    formPlanBadge,
    setFormPlanBadge,
    formPlanFeatures,
    setFormPlanFeatures,
    isSubmittingAdd,
  } = plansState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 6. ADD PLAN MODAL                                                    */}
      {/* ==================================================================== */}
      {isAddPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Subscription Plan</h3>
                  <p className="text-[11px] text-slate-500">
                    Configure new student subscription tier
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPlanModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formPlanName}
                    onChange={(e) => setFormPlanName(e.target.value)}
                    placeholder="e.g. Master Pass"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formPlanSubtitle}
                    onChange={(e) => setFormPlanSubtitle(e.target.value)}
                    placeholder="e.g. For competitive toppers"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPlanPrice}
                    onChange={(e) => setFormPlanPrice(e.target.value)}
                    placeholder="0 or more"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Original / MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formPlanOriginalPrice}
                    onChange={(e) => setFormPlanOriginalPrice(e.target.value)}
                    placeholder="e.g. 299"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPlanDurationDays}
                    onChange={(e) => setFormPlanDurationDays(e.target.value)}
                    placeholder="e.g. 180"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Renewal Window (days before expiry, blank = no renewal)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={formPlanRenewalWindow}
                  onChange={(e) => setFormPlanRenewalWindow(e.target.value)}
                  placeholder="e.g. 15 for yearly plans"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Students can renew once per cycle inside this window. Shorter plans usually leave
                  this blank and offer upgrades instead.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Badge Tag (optional)
                </label>
                <input
                  type="text"
                  value={formPlanBadge}
                  onChange={(e) => setFormPlanBadge(e.target.value)}
                  placeholder="e.g. New Launch, Most Popular"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Features (one per line)
                </label>
                <textarea
                  rows={3}
                  value={formPlanFeatures}
                  onChange={(e) => setFormPlanFeatures(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder={'Unlimited mock tests\nStatewide rank analysis\nVideo explanations'}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingAdd ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
