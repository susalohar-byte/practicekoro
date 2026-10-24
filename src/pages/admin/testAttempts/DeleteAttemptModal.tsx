import type { AdminTestAttemptsState } from './useAdminTestAttempts';

export interface DeleteAttemptModalProps {
  testAttemptsState: AdminTestAttemptsState;
}

export function DeleteAttemptModal({ testAttemptsState }: DeleteAttemptModalProps) {
  const { deleteConfirmationId, setDeleteConfirmationId, handleDeleteAttempt } = testAttemptsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 10. DELETE CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Delete Attempt Record</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete this student's attempt record? This will
              remove their scores and rank calculations.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAttempt(deleteConfirmationId)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
