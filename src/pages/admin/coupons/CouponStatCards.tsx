import { Ticket, CheckCircle2, Tag, BarChart2 } from 'lucide-react';
import type { AdminCouponsState } from './useAdminCoupons';

export interface CouponStatCardsProps {
  cp: AdminCouponsState;
}

export function CouponStatCards({ cp }: CouponStatCardsProps) {
  const { couponsList } = cp;
  return (
    <>
      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="pk-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Coupons */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Coupons</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {couponsList.length}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">in system</span>
          </div>
        </div>

        {/* Card 2: Active Coupons */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Active Coupons</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {couponsList.filter((c) => c.status === 'Active').length}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              currently active
            </span>
          </div>
        </div>

        {/* Card 3: Used Coupons */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Used Coupons</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {couponsList
                  .reduce((sum, c) => sum + (c.usedCount || 0), 0)
                  .toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Redeemed
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              total redemptions
            </span>
          </div>
        </div>

        {/* Card 4: Total Discount Given */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Total Discount Given
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {/* Per-redemption discount amounts are not recorded, so no total is invented. */}
              <span className="text-2xl font-bold text-slate-900 leading-tight">—</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              not tracked yet
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
