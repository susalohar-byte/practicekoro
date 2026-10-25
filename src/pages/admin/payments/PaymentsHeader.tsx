import { Check, Download, XCircle } from 'lucide-react';
import type { AdminPaymentsState } from './useAdminPayments';

export interface PaymentsHeaderProps {
  pay: AdminPaymentsState;
}

export function PaymentsHeader({ pay }: PaymentsHeaderProps) {
  const { recordsLoading, recordsError, toastMessage, toastType, handleExportPayments } = pay;
  return (
    <>
      {recordsError && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {recordsError}
        </div>
      )}
      {recordsLoading && (
        <div role="status" className="text-sm text-slate-500">
          Loading all records…
        </div>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role={toastType === 'error' ? 'alert' : 'status'}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200"
        >
          {toastType === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. HEADER & TOP CONTROLS                                             */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            View and manage all payment transactions, refunds and subscription purchases.
          </p>
        </div>

        <button
          disabled={recordsLoading || !!recordsError}
          onClick={handleExportPayments}
          className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-colors self-start shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Payments</span>
        </button>
      </div>
    </>
  );
}
