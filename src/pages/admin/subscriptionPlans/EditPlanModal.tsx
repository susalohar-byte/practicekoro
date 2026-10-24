import { Check, X, Pencil } from 'lucide-react';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface EditPlanModalProps {
  plansState: AdminSubscriptionPlansState;
}

export function EditPlanModal({ plansState }: EditPlanModalProps) {
  const {
    isEditPlanModalOpen,
    editingPlan,
    setIsEditPlanModalOpen,
    handleUpdatePlan,
    editPlanName,
    setEditPlanName,
    editPlanSubtitle,
    setEditPlanSubtitle,
    editPlanPrice,
    setEditPlanPrice,
    editPlanOriginalPrice,
    setEditPlanOriginalPrice,
    editPlanDurationDays,
    setEditPlanDurationDays,
    editPlanRenewalWindow,
    setEditPlanRenewalWindow,
    editPlanBadge,
    setEditPlanBadge,
    editButtonText,
    setEditButtonText,
    editPlanFeatures,
    setEditPlanFeatures,
    isSubmittingEdit,
  } = plansState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 6.1. EDIT PLAN MODAL                                                 */}
      {/* ==================================================================== */}
      {isEditPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Subscription Plan</h3>
                  <p className="text-[11px] text-slate-500">
                    Update pricing, duration, and features for {editingPlan.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditPlanModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editPlanName}
                    onChange={(e) => setEditPlanName(e.target.value)}
                    placeholder="e.g. Pro Plan"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={editPlanSubtitle}
                    onChange={(e) => setEditPlanSubtitle(e.target.value)}
                    placeholder="e.g. Complete preparation"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Pricing & Duration Block */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Pricing & Duration
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 mb-1 block">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editPlanPrice}
                      onChange={(e) => setEditPlanPrice(e.target.value)}
                      placeholder="0 or more"
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 mb-1 block">
                      Original / MRP (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPlanOriginalPrice}
                      onChange={(e) => setEditPlanOriginalPrice(e.target.value)}
                      placeholder="e.g. 299"
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 mb-1 block">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={editPlanDurationDays}
                      onChange={(e) => setEditPlanDurationDays(e.target.value)}
                      placeholder="e.g. 180"
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                  Renewal Window (days before expiry, blank = no renewal)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={editPlanRenewalWindow}
                  onChange={(e) => setEditPlanRenewalWindow(e.target.value)}
                  placeholder="e.g. 15 for yearly plans"
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Students can renew once per cycle inside this window. Shorter plans usually leave
                  this blank and offer upgrades instead.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                    Badge Tag (optional)
                  </label>
                  <input
                    type="text"
                    value={editPlanBadge}
                    onChange={(e) => setEditPlanBadge(e.target.value)}
                    placeholder="e.g. Most Popular, Best Value"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                    Button CTA Text
                  </label>
                  <input
                    type="text"
                    value={editButtonText}
                    onChange={(e) => setEditButtonText(e.target.value)}
                    placeholder="e.g. Get Pro Plan"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                  Features List (one per line)
                </label>
                <textarea
                  rows={4}
                  value={editPlanFeatures}
                  onChange={(e) => setEditPlanFeatures(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder={'Unlimited mock tests\nStatewide rank analysis\nVideo explanations'}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Put each feature on its own line to list it on the plan card.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmittingEdit ? 'Updating...' : 'Update Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
