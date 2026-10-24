import { Plus, ArrowUp, ArrowDown, Trash2, Save, FileQuestion, Upload } from 'lucide-react';
import { isMathematicsQuestion } from '@/utils/shortNotes';
import { Button } from '@/components/common/Button';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { MathText } from '@/components/common/MathText';
import type { MockTest } from '@/types';
import type { AdminTestQuestionsState } from './useAdminTestQuestions';

export interface AssignedQuestionsTabProps {
  testQuestionsState: AdminTestQuestionsState;
  test: MockTest;
}

export function AssignedQuestionsTab({ testQuestionsState, test }: AssignedQuestionsTabProps) {
  const {
    activeTab,
    assignedQuestions,
    eligibleBankQuestions,
    handleRemoveQuestion,
    handleSaveAssigned,
    isSaving,
    isTestLocked,
    moveQuestion,
    setActiveTab,
    setIsBulkModalOpen,
    totalAssignedMarks,
    updateQuestionMarks,
  } = testQuestionsState;
  return (
    <>
      {/* ===================================================================== */}
      {/* 4. TAB CONTENT B: ASSIGNED QUESTIONS IN TEST (ORDERING & REMOVAL)     */}
      {/* ===================================================================== */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {assignedQuestions.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] space-y-4 shadow-md">
              <FileQuestion className="w-14 h-14 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Questions Added to this Test Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  This test currently has 0 questions. Open the Question Selector or use Bulk TXT to
                  attach questions before students can take it.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] text-white text-xs font-bold shadow-md shadow-[#0075FF]/30"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setActiveTab('select')}
                >
                  Select from Topic Questions ({eligibleBankQuestions.length} Available)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 text-xs font-bold"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => setIsBulkModalOpen(true)}
                >
                  Bulk Add via TXT
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedQuestions.map((q, idx) => (
                <div
                  key={q.questionId}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all hover:border-[#0075FF]/50 shadow-xs hover:shadow-md"
                >
                  {/* Order Index & Position Steppers */}
                  <div className="flex items-center md:flex-col gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={1}
                      max={assignedQuestions.length}
                      value={idx + 1}
                      disabled={isTestLocked}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= assignedQuestions.length) {
                          moveQuestion(idx, val - 1);
                        }
                      }}
                      className="w-10 h-8 rounded-xl bg-[#0075FF]/10 border border-[#0075FF]/30 text-[#0075FF] dark:text-[#38bdf8] font-mono font-black text-xs text-center focus:outline-none focus:border-[#0075FF] shadow-xs"
                      title="Type position number to reorder"
                    />
                    <div className="flex md:flex-col gap-1">
                      <button
                        disabled={isTestLocked || idx === 0}
                        onClick={() => moveQuestion(idx, idx - 1)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#070d1d] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors border border-slate-200 dark:border-[#192b57]"
                        title="Move Question Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={isTestLocked || idx === assignedQuestions.length - 1}
                        onClick={() => moveQuestion(idx, idx + 1)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#070d1d] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors border border-slate-200 dark:border-[#192b57]"
                        title="Move Question Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Details */}
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-black text-slate-400 font-mono">Q#{idx + 1}</span>
                      {q.correctOption && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Correct: Option ({q.correctOption.toUpperCase()})
                        </span>
                      )}
                      {q.subjectName && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {q.subjectName}
                        </span>
                      )}
                    </div>

                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                      <MathText>{q.questionText}</MathText>
                    </p>

                    {q.questionBengaliText && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        <MathText>{q.questionBengaliText}</MathText>
                      </p>
                    )}

                    {/* Options List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          q.correctOption === 'A'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                          A
                        </span>
                        <span>
                          <MathText>{q.optionA}</MathText>
                        </span>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          q.correctOption === 'B'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                          B
                        </span>
                        <span>
                          <MathText>{q.optionB}</MathText>
                        </span>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          q.correctOption === 'C'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                          C
                        </span>
                        <span>
                          <MathText>{q.optionC}</MathText>
                        </span>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          q.correctOption === 'D'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                          D
                        </span>
                        <span>
                          <MathText>{q.optionD}</MathText>
                        </span>
                      </div>
                    </div>

                    {/* Short Notes (non-Math) / Explanation (Math) */}
                    {(q.explanationBengali || q.explanation) && (
                      <div className="pt-2">
                        <ShortNotesBox
                          explanation={q.explanationBengali || q.explanation}
                          isMathematics={isMathematicsQuestion(q)}
                          defaultExpanded={false}
                        />
                      </div>
                    )}
                  </div>

                  {/* Question Marks Scoring & Safe Remove Button */}
                  <div className="flex flex-row md:flex-col items-end justify-between md:justify-start gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-[#152347] pt-2 md:pt-0 md:pl-4">
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] uppercase font-black text-slate-400 block">
                        Marks
                      </label>
                      <div className="flex items-center gap-1.5 justify-end">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={q.marks}
                          disabled={isTestLocked}
                          onChange={(e) =>
                            updateQuestionMarks(idx, parseFloat(e.target.value) || 0)
                          }
                          className="w-14 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-xs font-black text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                        />
                      </div>
                    </div>

                    {/* Safe Remove Question Button */}
                    <button
                      onClick={() => handleRemoveQuestion(idx)}
                      disabled={isTestLocked || isSaving}
                      className="disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
                      title="Remove question from this mock test (it will remain safe in Question Bank)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Bottom Test Summary Card */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Total Test Summary
                  </h4>
                  <p className="text-xs text-slate-500">
                    {assignedQuestions.length} Questions Assigned • Total Sum:{' '}
                    <strong className="text-emerald-500 font-mono">
                      {totalAssignedMarks} Marks
                    </strong>{' '}
                    (Target: {test.totalMarks} Marks)
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] hover:from-[#026BFC] hover:to-[#0047C7] text-white text-xs font-bold shadow-md shadow-[#0075FF]/30"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveAssigned}
                  disabled={isSaving || isTestLocked}
                  title={isTestLocked ? 'Questions locked for active Live Test' : undefined}
                >
                  {isSaving ? 'Saving...' : 'Save All Changes'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
