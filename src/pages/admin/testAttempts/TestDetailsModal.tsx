import { X, ArrowRight, FileText } from 'lucide-react';
import type { AdminTestAttemptsState } from './useAdminTestAttempts';

export interface TestDetailsModalProps {
  testAttemptsState: AdminTestAttemptsState;
}

export function TestDetailsModal({ testAttemptsState }: TestDetailsModalProps) {
  const { navigate, isTestModalOpen, setIsTestModalOpen, activeModalAttempt } = testAttemptsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 9. TEST DETAILS MODAL */}
      {/* ==================================================================== */}
      {isTestModalOpen && activeModalAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Test Specifications</h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">{activeModalAttempt.testName}</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {activeModalAttempt.exam}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {activeModalAttempt.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Total Marks</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    {activeModalAttempt.totalMarks > 0 ? activeModalAttempt.totalMarks : '—'} Marks
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Total Questions</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    {activeModalAttempt.totalQuestions} Questions
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Duration</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">60 Minutes</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Negative Marking</span>
                  <p className="font-black text-rose-600 text-sm mt-0.5">-0.25 Marks</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-slate-700 text-xs">
                <span className="font-bold text-blue-900 block mb-1">Standard Pattern:</span>•
                Questions are prepared according to the latest official syllabus and marking scheme.
                • Bilingual options supported (Bengali & English).
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsTestModalOpen(false);
                  navigate('/admin/test-questions');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Manage Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
