import { X, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminTestAttemptsState } from './useAdminTestAttempts';

export interface AnswerSheetModalProps {
  testAttemptsState: AdminTestAttemptsState;
}

export function AnswerSheetModal({ testAttemptsState }: AnswerSheetModalProps) {
  const {
    isAnswerSheetModalOpen,
    setIsAnswerSheetModalOpen,
    activeModalAttempt,
    modalQuestionsList,
  } = testAttemptsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 8. FULL ANSWER SHEET MODAL */}
      {/* ==================================================================== */}
      {isAnswerSheetModalOpen && activeModalAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Student Answer Sheet • {activeModalAttempt.studentName} (
                  {activeModalAttempt.studentId})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeModalAttempt.testName} • Submitted on {activeModalAttempt.submittedAt}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
                <button
                  onClick={() => setIsAnswerSheetModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Summary Stats Banner */}
            <div className="bg-blue-50/50 border-b border-blue-100 p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Total Score</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {activeModalAttempt.score} /{' '}
                  {activeModalAttempt.totalMarks > 0 ? activeModalAttempt.totalMarks : '—'}
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Accuracy</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">
                  {activeModalAttempt.accuracy}%
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Correct</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">
                  {activeModalAttempt.correctAnswers} Qs
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Wrong</p>
                <p className="text-sm font-black text-rose-600 mt-0.5">
                  {activeModalAttempt.wrongAnswers} Qs
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100 col-span-2 sm:col-span-1">
                <p className="text-slate-500 text-[10px]">Time Spent</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {activeModalAttempt.timeTaken}
                </p>
              </div>
            </div>

            {/* Questions Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {modalQuestionsList.length === 0 && (
                <p className="py-10 text-center text-xs text-slate-400">
                  Answer details are unavailable for this attempt.
                </p>
              )}
              {modalQuestionsList.map((q) => (
                <div
                  key={q.id}
                  className={cn(
                    'p-4 rounded-xl border transition-colors',
                    q.status === 'correct' && 'border-emerald-200 bg-emerald-50/20',
                    q.status === 'wrong' && 'border-rose-200 bg-rose-50/20',
                    q.status === 'skipped' && 'border-slate-200 bg-slate-50/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {q.subject} • Question {q.id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.questionText}
                      </h4>
                      {q.questionTextBn && (
                        <p className="text-xs text-slate-600">{q.questionTextBn}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full shrink-0',
                        q.status === 'correct' && 'bg-emerald-100 text-emerald-800',
                        q.status === 'wrong' && 'bg-rose-100 text-rose-800',
                        q.status === 'skipped' && 'bg-slate-200 text-slate-700'
                      )}
                    >
                      {q.status === 'correct'
                        ? '+1.00 Marks'
                        : q.status === 'wrong'
                          ? '-0.25 Marks'
                          : 'Skipped (0.00)'}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                    {q.options.map((opt) => {
                      const isCorrect = opt.key === q.correctOption;
                      const isSelected = opt.key === q.selectedOption;

                      return (
                        <div
                          key={opt.key}
                          className={cn(
                            'p-2.5 rounded-lg border font-medium flex items-center justify-between',
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                              : isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-white border-slate-200 text-slate-700'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold w-5">{opt.key}.</span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                              Correct
                            </span>
                          )}
                          {!isCorrect && isSelected && (
                            <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
                              Selected
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-100/70 text-xs text-slate-700 space-y-0.5">
                      <span className="font-bold text-slate-900">Explanation:</span>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsAnswerSheetModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Answer Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
