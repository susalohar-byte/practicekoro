import { Send, X, Loader2 } from 'lucide-react';
import type { AdminStudentsState } from './useAdminStudents';

export interface SendStudentNotificationModalProps {
  studentsState: AdminStudentsState;
}

export function SendStudentNotificationModal({ studentsState }: SendStudentNotificationModalProps) {
  const {
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    selectedStudent,
    handleSendNotification,
    notificationText,
    setNotificationText,
    isWorking,
  } = studentsState;
  return (
    <>
      {/* MODAL 4: SEND NOTIFICATION MODAL                                    */}
      {/* =================================================================== */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#026BFC]" />
                <span>Send Notification</span>
              </h3>
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Send a targeted push notification or in-app message to{' '}
              <span className="font-semibold text-slate-800">{selectedStudent?.fullName}</span>.
            </p>

            <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New WBP Mock Test Available!"
                  value={notificationText.title}
                  onChange={(e) =>
                    setNotificationText((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Message</label>
                <textarea
                  rows={3}
                  placeholder="Enter message details..."
                  value={notificationText.message}
                  onChange={(e) =>
                    setNotificationText((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNotificationModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWorking}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isWorking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isWorking ? 'Sending…' : 'Send In-App Notification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
