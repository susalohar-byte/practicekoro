import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminPerformanceState } from './useAdminPerformance';

export interface PerformanceQuestionModalProps {
  perf: AdminPerformanceState;
}

export function PerformanceQuestionModal({ perf }: PerformanceQuestionModalProps) {
  const { selectedQuestion, setSelectedQuestion } = perf;
  return (
    <>
      {/* ==================================================================== */}
      {/* 6. MODAL: QUESTION INSPECTION MODAL */}
      {/* ==================================================================== */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center">
                  #{selectedQuestion.id}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">Question Inspection</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    selectedQuestion.subjectColor
                  )}
                >
                  {selectedQuestion.subject}
                </span>
                {selectedQuestion.chapter && (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {selectedQuestion.chapter}
                  </span>
                )}
                {selectedQuestion.difficulty && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full capitalize">
                    {selectedQuestion.difficulty}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <p className="font-extrabold text-slate-900 text-sm leading-relaxed">
                  {selectedQuestion.questionText}
                </p>
                {selectedQuestion.questionTextBn && (
                  <p className="text-xs text-slate-700 pt-1 border-t border-slate-200/60 leading-relaxed font-normal font-tiro">
                    {selectedQuestion.questionTextBn}
                  </p>
                )}
              </div>

              {/* Performance Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">
                    Total Attempts
                  </p>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {selectedQuestion.totalAttempts.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-rose-600 uppercase">Wrong Answers</p>
                  <p className="text-base font-black text-rose-700 mt-0.5">
                    {selectedQuestion.wrongCount?.toLocaleString() ??
                      Math.round(
                        (selectedQuestion.totalAttempts * selectedQuestion.wrongPercentage) / 100
                      ).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-rose-600 uppercase">Failure Rate</p>
                  <p className="text-base font-black text-rose-700 mt-0.5">
                    {selectedQuestion.wrongPercentage}%
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase">
                    Accuracy Rate
                  </p>
                  <p className="text-base font-black text-emerald-700 mt-0.5">
                    {selectedQuestion.accuracyRate ??
                      Math.max(0, 100 - selectedQuestion.wrongPercentage)}
                    %
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
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
