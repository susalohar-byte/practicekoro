import { Radio, X } from 'lucide-react';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestMonitorModalProps {
  live: AdminLiveTestsState;
}

export function LiveTestMonitorModal({ live }: LiveTestMonitorModalProps) {
  const {
    isMonitorModalOpen,
    setIsMonitorModalOpen,
    selectedLiveTest,
    selectedStats,
    submissionRate,
  } = live;
  return (
    <>
      {/* LIVE TEST MONITOR MODAL */}
      {isMonitorModalOpen && selectedLiveTest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900">
                  Live Test Monitor: {selectedLiveTest.title}
                </h2>
              </div>
              <button
                aria-label="Close"
                onClick={() => setIsMonitorModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                <span className="text-2xl font-bold text-blue-700">
                  {selectedStats.participants.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-blue-900 mt-0.5">Students Started</p>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                <span className="text-2xl font-bold text-emerald-700">
                  {selectedStats.submitted.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-emerald-900 mt-0.5">Submitted</p>
              </div>
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                <span className="text-2xl font-bold text-purple-700">
                  {Math.max(0, selectedStats.participants - selectedStats.submitted).toLocaleString(
                    'en-IN'
                  )}
                </span>
                <p className="text-xs text-purple-900 mt-0.5">Currently Writing</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Submission Rate</span>
                <span className="text-blue-600">
                  {submissionRate === null ? '—' : `${submissionRate}%`}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${submissionRate ?? 0}%` }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsMonitorModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Close Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
