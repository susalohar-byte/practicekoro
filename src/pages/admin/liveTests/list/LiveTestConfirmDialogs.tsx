import { Trash2, StopCircle } from 'lucide-react';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestConfirmDialogsProps {
  live: AdminLiveTestsState;
}

export function LiveTestConfirmDialogs({ live }: LiveTestConfirmDialogsProps) {
  const {
    deleteCandidate,
    setDeleteCandidate,
    endCandidate,
    setEndCandidate,
    handleEndLiveTest,
    handleDeleteLiveTest,
  } = live;
  return (
    <>
      {/* END CONFIRMATION DIALOG */}
      {endCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-full">
                <StopCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">End Live Test Now</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to end{' '}
              <span className="font-semibold text-slate-900">"{endCandidate.title}"</span>? All
              ongoing candidate attempts will be finalized and ranked statewide.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEndCandidate(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEndLiveTest(endCandidate)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm"
              >
                End Test Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Live Test</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">"{deleteCandidate.title}"</span>? This
              will permanently remove this live test event.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLiveTest}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm"
              >
                Delete Test
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
