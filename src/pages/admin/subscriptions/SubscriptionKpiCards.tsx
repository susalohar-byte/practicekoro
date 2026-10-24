import { Users, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { formatRecordedAmount } from '@/utils/adminFinancialDisplay';
import type { AdminSubscriptionsState } from './useAdminSubscriptions';

export interface SubscriptionKpiCardsProps {
  subscriptionsState: AdminSubscriptionsState;
}

export function SubscriptionKpiCards({ subscriptionsState }: SubscriptionKpiCardsProps) {
  const {
    totalSubscriptionsCount,
    activeSubscriptionsCount,
    expiringSoonCount,
    expiredSubscriptionsCount,
    totalRevenueAmount,
    revenueUnavailable,
  } = subscriptionsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 2. FIVE SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Total Subscriptions
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {totalSubscriptionsCount.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              in loaded records
            </span>
          </div>
        </div>

        {/* Card 2: Active Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Active Subscriptions
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {activeSubscriptionsCount.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              currently active
            </span>
          </div>
        </div>

        {/* Card 3: Expiring Soon */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Expiring Soon</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {expiringSoonCount.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">in next 7 days</span>
          </div>
        </div>

        {/* Card 4: Expired Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Expired Subscriptions
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {expiredSubscriptionsCount.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              in loaded records
            </span>
          </div>
        </div>

        {/* Card 5: Total Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-lg shrink-0">
            ₹
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Recorded Revenue</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {revenueUnavailable ? 'Unavailable' : formatRecordedAmount(totalRevenueAmount)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Completed linked payments in loaded records
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
