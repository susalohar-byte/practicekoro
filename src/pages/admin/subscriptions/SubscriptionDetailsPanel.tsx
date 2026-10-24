import { Clock, X, Crown, Edit2, Send, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRecordedAmount } from '@/utils/adminFinancialDisplay';
import type { AdminSubscriptionsState } from './useAdminSubscriptions';

export interface SubscriptionDetailsPanelProps {
  subscriptionsState: AdminSubscriptionsState;
}

export function SubscriptionDetailsPanel({ subscriptionsState }: SubscriptionDetailsPanelProps) {
  const {
    setSelectedRowId,
    isDetailsPanelOpen,
    setIsDetailsPanelOpen,
    activeDetailTab,
    setActiveDetailTab,
    isCancellingSubscription,
    setIsExtendModalOpen,
    setIsChangePlanModalOpen,
    setChangePlanStart,
    setIsNotificationModalOpen,
    showToast,
    selectedSubscription,
    handleCancelSubscription,
  } = subscriptionsState;
  return (
    <>
      {/* RIGHT COLUMN: SUBSCRIPTION DETAILS DOCKED PANEL */}
      {isDetailsPanelOpen && selectedSubscription && (
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Subscription Details</h2>
            <button
              onClick={() => {
                setIsDetailsPanelOpen(false);
                setSelectedRowId(null);
              }}
              className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Student Profile Card */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {selectedSubscription.avatarType === 'photo' && selectedSubscription.avatarSrc ? (
                <img
                  src={selectedSubscription.avatarSrc}
                  alt={selectedSubscription.studentName}
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
                  selectedSubscription.avatarBgColor || 'bg-blue-100',
                  selectedSubscription.avatarTextColor || 'text-blue-600'
                )}
                style={{
                  display:
                    selectedSubscription.avatarType === 'photo' && selectedSubscription.avatarSrc
                      ? 'none'
                      : 'flex',
                }}
              >
                {selectedSubscription.avatarInitials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedSubscription.studentName}
                  </h3>
                  <span
                    className={cn(
                      'px-2 py-0.2 rounded text-[10px] font-semibold',
                      selectedSubscription.statusBadgeClass
                    )}
                  >
                    {selectedSubscription.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {selectedSubscription.studentEmail}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {selectedSubscription.studentPhone || '+91 98765 43210'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsExtendModalOpen(true)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 font-medium shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3 h-3 text-slate-400" />
              <span>Edit</span>
            </button>
          </div>

          {/* 4 Detail Tabs */}
          <div className="flex items-center border-b border-slate-100 text-xs">
            {(['Overview', 'Payments', 'Test Access', 'Activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDetailTab(tab)}
                className={cn(
                  'py-2 px-3 font-semibold transition-all relative cursor-pointer',
                  activeDetailTab === tab ? 'text-[#2563EB]' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {tab}
                {activeDetailTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab: Overview Content */}
          {activeDetailTab === 'Overview' && (
            <div className="space-y-4 pt-1">
              {/* Active Plan Green Banner */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {selectedSubscription.planFullTitle}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Valid till {selectedSubscription.endDate} (
                      {Math.ceil((selectedSubscription.daysLeft || 124) / 30)} months left)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setChangePlanStart('today');
                    setIsChangePlanModalOpen(true);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 font-medium shrink-0 cursor-pointer shadow-2xs"
                >
                  Change Plan
                </button>
              </div>

              {/* Subscription Info Breakdown */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 text-xs mb-2">Subscription Info</h4>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-normal">Plan Name</span>
                  <span className="font-medium text-slate-800">
                    {selectedSubscription.planFullTitle}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-normal">Amount</span>
                  <span className="font-bold text-slate-900">
                    {formatRecordedAmount(
                      selectedSubscription.amount,
                      selectedSubscription.paymentCurrency
                    )}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-normal">Status</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium',
                      selectedSubscription.statusBadgeClass
                    )}
                  >
                    {selectedSubscription.status}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-normal">Start Date</span>
                  <span className="font-medium text-slate-800">
                    {selectedSubscription.startDate}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-normal">End Date</span>
                  <span className="font-medium text-slate-800">{selectedSubscription.endDate}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-normal">Days Left</span>
                  <span className="font-semibold text-slate-800">
                    {selectedSubscription.daysLeft || 124} days
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-normal">Auto Renew</span>
                  <span className="font-medium text-slate-700">
                    {selectedSubscription.autoRenew ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-normal">Payment Method</span>
                  <span className="font-medium text-slate-800">
                    {selectedSubscription.paymentMethod}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-normal">Transaction ID</span>
                  <span className="font-mono text-slate-700">
                    {selectedSubscription.transactionId || 'pay_2F9kLmX8vP6QeH'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-normal">Created At</span>
                  <span className="font-medium text-slate-800">
                    {selectedSubscription.createdAt || '12 Aug 2026, 11:20 AM'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-normal">Last Updated</span>
                  <span className="font-medium text-slate-800">
                    {selectedSubscription.lastUpdated || '12 Aug 2026, 11:20 AM'}
                  </span>
                </div>
              </div>

              {/* Quick Actions (4 Buttons) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs mb-2">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      showToast(
                        `Navigating to student profile of ${selectedSubscription.studentName}`
                      )
                    }
                    className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Student</span>
                  </button>

                  <button
                    onClick={() => setIsExtendModalOpen(true)}
                    className="border border-blue-200 text-[#2563EB] hover:bg-blue-50 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Extend Subscription</span>
                  </button>

                  <button
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-400" />
                    <span>Send Notification</span>
                  </button>

                  <button
                    onClick={() => handleCancelSubscription(selectedSubscription)}
                    disabled={isCancellingSubscription || selectedSubscription.status !== 'Active'}
                    className="border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isCancellingSubscription ? 'Cancelling…' : 'Cancel Subscription'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Payments Content */}
          {activeDetailTab === 'Payments' && (
            <div className="space-y-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Initial Activation</span>
                  <span>
                    {formatRecordedAmount(
                      selectedSubscription.amount,
                      selectedSubscription.paymentCurrency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>{selectedSubscription.startDate}</span>
                  <span className="text-emerald-600 font-semibold">
                    {selectedSubscription.paymentStatus || 'Unavailable'}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 text-center py-4">
                Only linked payment data is shown.
              </div>
            </div>
          )}

          {/* Tab: Test Access Content */}
          {activeDetailTab === 'Test Access' && (
            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span>WBP Constable Full Mocks</span>
                <span className="text-emerald-600 font-bold">Unlocked</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span>WBPSC Clerkship Mocks</span>
                <span className="text-emerald-600 font-bold">Unlocked</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span>Topic-wise Unlimited Drills</span>
                <span className="text-emerald-600 font-bold">Unlocked</span>
              </div>
            </div>
          )}

          {/* Tab: Activity Content */}
          {activeDetailTab === 'Activity' && (
            <div className="space-y-2 text-xs pt-1 text-slate-600">
              <div className="border-l-2 border-blue-400 pl-3 py-1">
                <span className="font-semibold block text-slate-800">Subscription Created</span>
                <span className="text-[10px] text-slate-400">{selectedSubscription.createdAt}</span>
              </div>
              <div className="border-l-2 border-emerald-400 pl-3 py-1">
                <span className="font-semibold block text-slate-800">Payment Verified</span>
                <span className="text-[10px] text-slate-400">
                  Via {selectedSubscription.paymentMethod}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
