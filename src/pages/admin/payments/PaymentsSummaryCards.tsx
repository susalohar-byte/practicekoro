import { CheckCircle2, Clock, RotateCcw, Users, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminPaymentsState } from './useAdminPayments';

export interface PaymentsSummaryCardsProps {
  pay: AdminPaymentsState;
}

export function PaymentsSummaryCards({ pay }: PaymentsSummaryCardsProps) {
  const {
    timeRange,
    totalRevenue,
    totalPayments,
    totalVolume,
    successfulPayments,
    successfulAmount,
    pendingPayments,
    pendingAmount,
    failedPayments,
    failedAmount,
    refundedPayments,
    refundedAmount,
    successRate,
    filterStatus,
    setFilterStatus,
    setCurrentPage,
  } = pay;

  const handleCardFilter = (status: string) => {
    if (filterStatus === status) {
      setFilterStatus('All Status');
    } else {
      setFilterStatus(status);
    }
    setCurrentPage(1);
  };

  return (
    <>
      {/* SUMMARY METRICS CARDS: 6-CARD GRID INCLUDING SUCCESS, PENDING & FAILED */}
      {/* ==================================================================== */}
      <div className="pk-stagger grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Retained Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-lg shrink-0">
            ₹
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Retained Revenue</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg xl:text-xl font-bold text-slate-900 leading-tight">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">{timeRange}</span>
          </div>
        </div>

        {/* Card 2: Total Payments */}
        <button
          type="button"
          onClick={() => handleCardFilter('All Status')}
          className={cn(
            'bg-white rounded-2xl border p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all text-left cursor-pointer',
            filterStatus === 'All Status'
              ? 'border-blue-300 ring-2 ring-blue-500/20'
              : 'border-slate-100 hover:border-slate-200'
          )}
        >
          <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Payments</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg xl:text-xl font-bold text-slate-900 leading-tight">
                {totalPayments.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              ₹{totalVolume.toLocaleString('en-IN')} vol
            </span>
          </div>
        </button>

        {/* Card 3: Successful */}
        <button
          type="button"
          onClick={() => handleCardFilter('Success')}
          className={cn(
            'bg-white rounded-2xl border p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all text-left cursor-pointer',
            filterStatus === 'Success'
              ? 'border-emerald-400 ring-2 ring-emerald-500/20 bg-emerald-50/20'
              : 'border-slate-100 hover:border-emerald-200'
          )}
        >
          <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Successful</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg xl:text-xl font-bold text-slate-900 leading-tight">
                {successfulPayments.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {successRate}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5 truncate">
              ₹{successfulAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </button>

        {/* Card 4: Pending */}
        <button
          type="button"
          onClick={() => handleCardFilter('Pending')}
          className={cn(
            'bg-white rounded-2xl border p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all text-left cursor-pointer',
            filterStatus === 'Pending'
              ? 'border-amber-400 ring-2 ring-amber-500/20 bg-amber-50/20'
              : 'border-slate-100 hover:border-amber-200'
          )}
        >
          <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Pending</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg xl:text-xl font-bold text-slate-900 leading-tight">
                {pendingPayments.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-amber-600 font-medium block mt-0.5 truncate">
              ₹{pendingAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </button>

        {/* Card 5: Failed */}
        <button
          type="button"
          onClick={() => handleCardFilter('Failed')}
          className={cn(
            'bg-white rounded-2xl border p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all text-left cursor-pointer',
            filterStatus === 'Failed'
              ? 'border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/20'
              : 'border-slate-100 hover:border-rose-200'
          )}
        >
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Failed</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg xl:text-xl font-bold text-slate-900 leading-tight">
                {failedPayments.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-rose-500 font-medium block mt-0.5 truncate">
              ₹{failedAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </button>

        {/* Card 6: Refunded */}
        <button
          type="button"
          onClick={() => handleCardFilter('Refunded')}
          className={cn(
            'bg-white rounded-2xl border p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all text-left cursor-pointer',
            filterStatus === 'Refunded'
              ? 'border-orange-400 ring-2 ring-orange-500/20 bg-orange-50/20'
              : 'border-slate-100 hover:border-orange-200'
          )}
        >
          <div className="w-11 h-11 rounded-xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Refunded</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg xl:text-xl font-bold text-slate-900 leading-tight">
                {refundedPayments.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-orange-600 font-medium block mt-0.5 truncate">
              ₹{refundedAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </button>
      </div>
    </>
  );
}
