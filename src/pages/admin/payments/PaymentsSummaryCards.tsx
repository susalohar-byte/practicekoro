import { CheckCircle2, RotateCcw, Users, XCircle } from 'lucide-react';
import type { AdminPaymentsState } from './useAdminPayments';

export interface PaymentsSummaryCardsProps {
  pay: AdminPaymentsState;
}

export function PaymentsSummaryCards({ pay }: PaymentsSummaryCardsProps) {
  const {
    timeRange,
    totalRevenue,
    totalPayments,
    successfulPayments,
    failedPayments,
    refundedPayments,
    successRate,
  } = pay;
  return (
    <>
      {/* 2. FIVE SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Retained Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-lg shrink-0">
            ₹
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Retained Revenue</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">{timeRange}</span>
          </div>
        </div>

        {/* Card 2: Total Payments */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Payments</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {totalPayments.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">{timeRange}</span>
          </div>
        </div>

        {/* Card 3: Successful */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Successful</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {successfulPayments.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {successRate}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">success rate</span>
          </div>
        </div>

        {/* Card 4: Failed */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Failed</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {failedPayments.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">{timeRange}</span>
          </div>
        </div>

        {/* Card 5: Refunded */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Refunded</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {refundedPayments.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">{timeRange}</span>
          </div>
        </div>
      </div>
    </>
  );
}
