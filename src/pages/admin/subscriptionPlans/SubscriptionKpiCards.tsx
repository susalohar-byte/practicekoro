import { Users, CreditCard, Gift } from 'lucide-react';

export function SubscriptionKpiCards() {
  return (
    <>
      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Subscribers */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Subscribers</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">5,480</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 26%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              from last month
            </span>
          </div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center font-bold text-xl shrink-0">
            ₹
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Monthly Revenue</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">₹86,420</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 18%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              from last month
            </span>
          </div>
        </div>

        {/* Card 3: Active Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Active Subscriptions
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">4,920</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 32%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              currently active
            </span>
          </div>
        </div>

        {/* Card 4: Converted from Free */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Converted from Free
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">1,120</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 24%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">this month</span>
          </div>
        </div>
      </div>
    </>
  );
}
