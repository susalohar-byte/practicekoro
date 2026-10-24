import type { AdminSubscriptionsState } from './useAdminSubscriptions';

export interface SendReminderModalProps {
  subscriptionsState: AdminSubscriptionsState;
}

export function SendReminderModal({ subscriptionsState }: SendReminderModalProps) {
  const {
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    isSubmitting,
    notificationMessage,
    setNotificationMessage,
    selectedSubscription,
    handleSendReminder,
  } = subscriptionsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 8. SEND NOTIFICATION MODAL                                           */}
      {/* ==================================================================== */}
      {isNotificationModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Send Subscription Reminder</h3>
            <p className="text-xs text-slate-500 mb-3">
              Direct in-app notification delivered to{' '}
              <strong>{selectedSubscription.studentName}</strong>
            </p>

            <textarea
              rows={4}
              value={
                notificationMessage ||
                `Hello ${selectedSubscription.studentName}, your PracticeKoro ${selectedSubscription.planFullTitle} has ${selectedSubscription.daysLeft ?? 0} days remaining. Renew today to maintain uninterrupted mock test access!`
              }
              onChange={(e) => setNotificationMessage(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-3"
            />

            <p className="text-[11px] text-slate-400 mb-4">
              Stored directly in the student's notification center.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReminder}
                disabled={isSubmitting}
                className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Sending…' : 'Send Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
