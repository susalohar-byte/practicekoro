import { Percent, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminCouponsState } from './useAdminCoupons';

export interface CouponFormPanelProps {
  cp: AdminCouponsState;
}

export function CouponFormPanel({ cp }: CouponFormPanelProps) {
  const {
    availablePlans,
    todayDateStr,
    formCode,
    setFormCode,
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    formDiscountType,
    setFormDiscountType,
    formDiscountValue,
    setFormDiscountValue,
    formMaxDiscount,
    setFormMaxDiscount,
    formApplicablePlanId,
    setFormApplicablePlanId,
    formUsageLimit,
    setFormUsageLimit,
    formValidFrom,
    setFormValidFrom,
    formValidUntil,
    setFormValidUntil,
    formActiveImmediately,
    setFormActiveImmediately,
    formFirstTimeOnly,
    setFormFirstTimeOnly,
    editingCoupon,
    setEditingCoupon,
    submitLock,
    isSubmittingCoupon,
    showToast,
    handleGenerateCode,
    handleCreateCoupon,
  } = cp;
  return (
    <>
      {/* RIGHT COLUMN: CREATE NEW COUPON FORM PANEL (4 COLS) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
        </h2>

        <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
          <fieldset disabled={isSubmittingCoupon} className="space-y-3.5">
            {/* Coupon Code with Generate button */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                Coupon Code <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  aria-label="Coupon code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME50"
                  className="flex-1 font-mono uppercase font-bold border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-3 py-2 text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                aria-label="Title"
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Welcome Offer"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-700">Description</label>
                <span className="text-[10px] text-slate-400">{formDescription.length}/200</span>
              </div>
              <textarea
                rows={2}
                maxLength={200}
                aria-label="Coupon description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Get 50% off on your first subscription."
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Discount Type segmented pills */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 mb-1.5 block">
                Discount Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormDiscountType('percentage')}
                  className={cn(
                    'py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all',
                    formDiscountType === 'percentage'
                      ? 'bg-blue-50 border-blue-300 text-[#2563EB] shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Percentage</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormDiscountType('fixed')}
                  className={cn(
                    'py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all',
                    formDiscountType === 'fixed'
                      ? 'bg-blue-50 border-blue-300 text-[#2563EB] shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Fixed Amount</span>
                </button>
              </div>
            </div>

            {/* Discount Value & Maximum Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Discount Value <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    aria-label="Discount value"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                    {formDiscountType === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block truncate">
                  Maximum Discount (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    aria-label="Maximum discount"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    placeholder="100"
                    className="w-full border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                    ₹
                  </span>
                </div>
              </div>
            </div>

            {/* Applicable Plan Dropdown */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                Applicable Plan <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Applicable plan"
                value={formApplicablePlanId}
                onChange={(e) => setFormApplicablePlanId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="">All Plans</option>
                {editingCoupon?.applicablePlanId &&
                  !availablePlans.some((p) => p.id === editingCoupon.applicablePlanId) && (
                    <option value={editingCoupon.applicablePlanId}>
                      Current plan (details unavailable)
                    </option>
                  )}
                {availablePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (₹{p.price})
                  </option>
                ))}
              </select>
            </div>

            {/* Usage Limit */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-700">
                  Usage Limit (Optional)
                </label>
                <span className="text-[10px] text-slate-400">0 = unlimited</span>
              </div>
              <input
                type="number"
                aria-label="Usage limit"
                value={formUsageLimit}
                onChange={(e) => setFormUsageLimit(e.target.value)}
                placeholder="500"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Validity Period (Real Date Inputs) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Valid From <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  aria-label="Valid from"
                  value={formValidFrom}
                  onChange={(e) => setFormValidFrom(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Valid Until (Optional)
                </label>
                <input
                  type="date"
                  aria-label="Valid until"
                  value={formValidUntil}
                  onChange={(e) => setFormValidUntil(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 pt-1 border-t border-slate-100">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">
                    Active immediately
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Enable this coupon right after creation
                  </span>
                </div>
                <button
                  role="switch"
                  aria-checked={formActiveImmediately}
                  aria-label="Active immediately"
                  type="button"
                  onClick={() => setFormActiveImmediately(!formActiveImmediately)}
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors relative cursor-pointer',
                    formActiveImmediately ? 'bg-[#2563EB]' : 'bg-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs',
                      formActiveImmediately ? 'left-5.5' : 'left-0.5'
                    )}
                  />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">
                    Limit to one use per user
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Only applicable for new users
                  </span>
                </div>
                <button
                  role="switch"
                  aria-checked={formFirstTimeOnly}
                  aria-label="Limit to one use per user"
                  type="button"
                  onClick={() => setFormFirstTimeOnly(!formFirstTimeOnly)}
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors relative cursor-pointer',
                    formFirstTimeOnly ? 'bg-[#2563EB]' : 'bg-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs',
                      formFirstTimeOnly ? 'left-5.5' : 'left-0.5'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Panel Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (submitLock.current) return;
                  setEditingCoupon(null);
                  setFormDiscountType('percentage');
                  setFormUsageLimit('500');
                  setFormFirstTimeOnly(false);
                  setFormActiveImmediately(true);
                  setFormCode('WELCOME50');
                  setFormTitle('Welcome Offer');
                  setFormDescription('Get 50% off on your first subscription.');
                  setFormDiscountValue('50');
                  setFormMaxDiscount('100');
                  setFormApplicablePlanId('');
                  setFormValidFrom(todayDateStr);
                  setFormValidUntil('');
                  showToast('Form reset.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingCoupon}
                className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingCoupon
                  ? 'Saving...'
                  : editingCoupon
                    ? 'Save Coupon Changes'
                    : 'Create Coupon'}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </>
  );
}
