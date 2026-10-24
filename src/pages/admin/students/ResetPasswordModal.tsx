import { KeyRound, Loader2 } from 'lucide-react';
import type { AdminStudentsState } from './useAdminStudents';

export interface ResetPasswordModalProps {
  studentsState: AdminStudentsState;
}

export function ResetPasswordModal({ studentsState }: ResetPasswordModalProps) {
  const {
    isResetPasswordModalOpen,
    selectedStudent,
    setIsResetPasswordModalOpen,
    handleResetPassword,
    isWorking,
  } = studentsState;
  return (
    <>
      {/* MODAL 5: RESET PASSWORD CONFIRMATION                                */}
      {/* =================================================================== */}
      {isResetPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#026BFC] flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5 text-[#026BFC]" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Reset Student Password</h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to send password reset link to{' '}
              <span className="font-semibold text-slate-800">{selectedStudent?.email}</span>?
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={isWorking}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isWorking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isWorking ? 'Sending…' : 'Send Reset Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
