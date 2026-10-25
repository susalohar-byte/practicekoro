import { AlertCircle } from 'lucide-react';
import type { AdminCutoffState } from './useAdminCutoff';

export interface CutoffDeleteModalProps {
  co: AdminCutoffState;
}

export function CutoffDeleteModal({ co }: CutoffDeleteModalProps) {
  const { deleteConfirmItem, setDeleteConfirmItem, handleDeleteCutoff } = co;
  return (
    <>
      {/* ==================================================================== */}
      {/* 7. DELETE CONFIRMATION MODAL                                         */}
      {/* ==================================================================== */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Delete Cutoff Benchmark?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to remove cutoff data for{' '}
              <strong className="text-slate-800">
                {deleteConfirmItem.exam} ({deleteConfirmItem.category})
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCutoff}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
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
