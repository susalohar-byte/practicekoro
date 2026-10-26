import { Ban, Crown, Download, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminPaymentsState } from './useAdminPayments';

export interface PaymentDetailsPanelProps {
  pay: AdminPaymentsState;
}

export function PaymentDetailsPanel({ pay }: PaymentDetailsPanelProps) {
  const {
    setSelectedRowId,
    isDetailsPanelOpen,
    setIsDetailsPanelOpen,
    isCancellingSubscription,
    showToast,
    selectedPayment,
    handleDownloadInvoice,
    handleSendReceipt,
    handleOpenRefund,
    handleCancelPayment,
  } = pay;
  return (
    <>
      {/* RIGHT COLUMN: PAYMENT DETAILS PANEL */}
      {isDetailsPanelOpen && selectedPayment && (
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Payment Details</h2>
            <button
              onClick={() => {
                setIsDetailsPanelOpen(false);
                setSelectedRowId('');
              }}
              className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Student Profile Card */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {selectedPayment.avatarType === 'photo' && selectedPayment.avatarSrc ? (
                <img
                  src={selectedPayment.avatarSrc}
                  alt={selectedPayment.studentName}
                  className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-blue-100 border border-slate-200"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-blue-100',
                  selectedPayment.avatarBgColor || 'bg-blue-100',
                  selectedPayment.avatarTextColor || 'text-blue-600'
                )}
                style={{
                  display:
                    selectedPayment.avatarType === 'photo' && selectedPayment.avatarSrc
                      ? 'none'
                      : 'flex',
                }}
              >
                {selectedPayment.avatarInitials}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedPayment.studentName}</h3>
                <span className="text-[11px] text-slate-500 block">
                  {selectedPayment.studentEmail}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {selectedPayment.studentPhone || 'Unavailable'}
                </span>
              </div>
            </div>

            <button
              onClick={() => showToast(`Opening profile for ${selectedPayment.studentName}...`)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 font-medium shrink-0 cursor-pointer"
            >
              View Student
            </button>
          </div>

          {/* Key-Value Breakdown List */}
          <div className="space-y-2.5 text-xs pt-1 border-t border-slate-100">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-normal">Transaction ID</span>
              <span className="font-mono text-slate-700">{selectedPayment.transactionId}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-normal">Payment Gateway</span>
              <span className="font-medium text-slate-800">{selectedPayment.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-normal">Status</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-medium',
                  selectedPayment.statusBadgeClass
                )}
              >
                {selectedPayment.status}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-normal">Plan Name</span>
              <span className="font-medium text-slate-800">{selectedPayment.planDuration}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-normal">Amount</span>
              <span className="font-bold text-slate-900">₹{selectedPayment.amount}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-normal">Paid On</span>
              <span className="font-medium text-slate-800">
                {selectedPayment.date}, {selectedPayment.time}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-normal">Payment Gateway</span>
              <span className="font-medium text-slate-800">
                {selectedPayment.paymentMethod === 'Razorpay' ? 'Razorpay' : 'PhonePe / UPI'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-normal">Gateway Order ID</span>
              <span className="font-mono text-slate-700">
                {selectedPayment.gatewayOrderId || '—'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-normal">Payment ID</span>
              <span className="font-mono text-slate-700">
                {selectedPayment.paymentId || selectedPayment.transactionId}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-normal">Bank Reference</span>
              <span className="font-mono text-slate-700">
                {selectedPayment.bankReference || '—'}
              </span>
            </div>
            <div className="flex justify-between py-0.5 items-center">
              <span className="text-slate-400 font-normal">Receipt</span>
              <button
                onClick={handleDownloadInvoice}
                className="text-[#2563EB] hover:underline flex items-center gap-1 font-semibold text-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Receipt</span>
              </button>
            </div>
          </div>

          {/* Subscription Status Green Box */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Subscription Status</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    {selectedPayment.subscriptionActive == null
                      ? 'Unavailable'
                      : selectedPayment.subscriptionActive
                        ? 'Active'
                        : 'Inactive'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {selectedPayment.subscriptionValidTill
                    ? `Valid till ${selectedPayment.subscriptionValidTill} (${selectedPayment.subscriptionDaysLeft ?? 0} days left)`
                    : 'Subscription details unavailable'}
                </span>
              </div>
            </div>

            <button
              onClick={() => showToast('Managing subscription plan settings...')}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 font-medium shrink-0 cursor-pointer shadow-2xs"
            >
              Manage
            </button>
          </div>

          {/* Bottom Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleSendReceipt}
              className="border border-blue-200 text-[#2563EB] hover:bg-blue-50 px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Receipt</span>
            </button>

            <button
              onClick={() => handleOpenRefund(selectedPayment)}
              disabled={selectedPayment.status !== 'Success'}
              className="border border-amber-200 text-amber-700 hover:bg-amber-50 px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refund Payment</span>
            </button>

            <button
              onClick={handleCancelPayment}
              disabled={
                isCancellingSubscription ||
                selectedPayment.subscriptionActive !== true ||
                !selectedPayment.sourcePayment.subscriptionId
              }
              className="border border-rose-200 text-rose-600 hover:bg-rose-50 px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{isCancellingSubscription ? 'Cancelling…' : 'Cancel Subscription'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
