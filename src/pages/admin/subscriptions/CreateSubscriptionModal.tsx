import { Plus, X } from 'lucide-react';
import type { AdminSubscriptionsState } from './useAdminSubscriptions';

export interface CreateSubscriptionModalProps {
  subscriptionsState: AdminSubscriptionsState;
}

export function CreateSubscriptionModal({ subscriptionsState }: CreateSubscriptionModalProps) {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    availablePlans,
    formStudentName,
    setFormStudentName,
    formStudentEmail,
    setFormStudentEmail,
    formSelectedPlanId,
    setFormSelectedPlanId,
    isSubmitting,
    handleCreateSubmit,
  } = subscriptionsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 5. CREATE SUBSCRIPTION MODAL                                         */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Subscription</h3>
                  <p className="text-[11px] text-slate-500">
                    Assign pass access manually to a registered learner
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Student Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formStudentName}
                  onChange={(e) => setFormStudentName(e.target.value)}
                  placeholder="e.g. Aniket Banerjee"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Student Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formStudentEmail}
                  onChange={(e) => setFormStudentEmail(e.target.value)}
                  placeholder="e.g. aniket.b@gmail.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Subscription Plan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formSelectedPlanId}
                    onChange={(e) => setFormSelectedPlanId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none"
                  >
                    {availablePlans.length === 0 ? (
                      <option value="">No active plans found</option>
                    ) : (
                      availablePlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.durationDays} days - ₹{p.price})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Access Type
                  </label>
                  <div className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 bg-slate-50 font-medium">
                    Manual Admin Grant
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Direct access grant. Does not fabricate financial revenue or fake gateway
                    orders.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || availablePlans.length === 0}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Activating…' : 'Activate Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
