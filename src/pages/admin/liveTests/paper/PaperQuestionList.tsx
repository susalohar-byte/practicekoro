import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { MathText } from '@/components/common/MathText';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { cn } from '@/lib/utils';
import { isMathematicsQuestion } from '@/utils/shortNotes';
import type { LiveTestWorkspaceState } from './useLiveTestWorkspace';

export interface PaperQuestionListProps {
  ws: LiveTestWorkspaceState;
}

export function PaperQuestionList({ ws }: PaperQuestionListProps) {
  const {
    activeQuestionId,
    setActiveQuestionId,
    viewMode,
    searchQuery,
    pageSize,
    currentPage,
    setCurrentPage,
    activeQuestion,
    filteredQuestions,
    totalPages,
    paginatedQuestions,
    assignedQuestions,
    handleRemoveQuestion,
    isSaving,
    isTestLocked,
    moveQuestion,
    updateQuestionMarks,
  } = ws;
  return (
    <>
      {/* LEFT: TABLE / CARDS PANEL */}
      <div
        className={cn(
          'transition-all duration-300 space-y-3',
          activeQuestion ? 'lg:col-span-8' : 'lg:col-span-12'
        )}
      >
        {viewMode === 'table' ? (
          /* TABLE VIEW: QUESTION BANK STYLE */
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200/80">
                  <tr className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 w-16 text-center">#</th>
                    <th className="py-3 px-4 min-w-[240px]">Question (Preview)</th>
                    <th className="py-3 px-3">Subject / Section</th>
                    <th className="py-3 px-3 text-center">Correct Key</th>
                    <th className="py-3 px-3 text-center">Marks</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium">
                  {paginatedQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No questions found matching &ldquo;{searchQuery}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    paginatedQuestions.map((q) => {
                      const originalIndex = assignedQuestions.findIndex(
                        (item) => item.questionId === q.questionId
                      );
                      const isActive = activeQuestionId === q.questionId;

                      return (
                        <tr
                          key={q.questionId}
                          onClick={() => setActiveQuestionId(q.questionId)}
                          className={cn(
                            'hover:bg-slate-50/90 transition-colors cursor-pointer group',
                            isActive && 'bg-blue-50/70 border-l-4 border-l-blue-600 font-semibold'
                          )}
                        >
                          {/* Order & Reorder Column */}
                          <td
                            className="py-3 px-2 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={1}
                                max={assignedQuestions.length}
                                value={originalIndex + 1}
                                disabled={isTestLocked}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val >= 1 && val <= assignedQuestions.length) {
                                    moveQuestion(originalIndex, val - 1);
                                  }
                                }}
                                className="w-9 h-7 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-700 font-mono font-bold text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                                title="Type number to jump position"
                              />
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  disabled={isTestLocked || originalIndex === 0}
                                  onClick={() => moveQuestion(originalIndex, originalIndex - 1)}
                                  className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    isTestLocked || originalIndex === assignedQuestions.length - 1
                                  }
                                  onClick={() => moveQuestion(originalIndex, originalIndex + 1)}
                                  className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Question Preview Column */}
                          <td className="py-3 px-4 max-w-[340px]">
                            <div className="space-y-0.5">
                              {q.questionBengaliText && (
                                <p className="text-xs font-semibold text-slate-900 truncate leading-snug">
                                  {q.questionBengaliText}
                                </p>
                              )}
                              <p
                                className={cn(
                                  'text-xs truncate leading-snug',
                                  q.questionBengaliText
                                    ? 'text-slate-500 text-[11px]'
                                    : 'font-semibold text-slate-900'
                                )}
                              >
                                {q.questionText || '—'}
                              </p>
                            </div>
                          </td>

                          {/* Subject Badge */}
                          <td className="py-3 px-3 text-slate-700">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 truncate inline-block max-w-[140px]">
                              {q.subjectName || 'General'}
                            </span>
                          </td>

                          {/* Correct Option Key */}
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/90 inline-flex items-center gap-1 shadow-2xs">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Option ({q.correctOption?.toUpperCase() || '—'})</span>
                            </span>
                          </td>

                          {/* Marks Column */}
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              value={q.marks}
                              disabled={isTestLocked}
                              onChange={(e) =>
                                updateQuestionMarks(originalIndex, parseFloat(e.target.value) || 0)
                              }
                              className="w-14 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-black font-mono text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                              title="Edit individual question marks"
                            />
                          </td>

                          {/* Actions Column */}
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setActiveQuestionId(q.questionId)}
                                className={cn(
                                  'p-1.5 rounded-lg border transition-colors cursor-pointer',
                                  isActive
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300'
                                )}
                                title="Inspect Question Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isTestLocked}
                                onClick={() => handleRemoveQuestion(originalIndex)}
                                className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-30 cursor-pointer"
                                title="Remove Question from Paper"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500 gap-2">
                <div>
                  Showing{' '}
                  <strong className="text-slate-800">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong className="text-slate-800">
                    {Math.min(currentPage * pageSize, filteredQuestions.length)}
                  </strong>{' '}
                  of <strong className="text-slate-800">{filteredQuestions.length}</strong>{' '}
                  questions
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 inline mr-0.5" /> Prev
                  </button>

                  <div className="px-2 text-xs font-bold text-slate-700">
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CARDS VIEW FALLBACK */
          <div className="space-y-3.5">
            {filteredQuestions.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                No questions found matching &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div
                  key={q.questionId}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  {/* Left Reorder Steppers */}
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
                      className="w-10 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-mono font-black text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                      title="Type number to jump position"
                    />
                    <div className="flex md:flex-col gap-1">
                      <button
                        type="button"
                        disabled={isTestLocked || idx === 0}
                        onClick={() => moveQuestion(idx, idx - 1)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isTestLocked || idx === assignedQuestions.length - 1}
                        onClick={() => moveQuestion(idx, idx + 1)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Body */}
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-mono font-black text-slate-400">Q#{idx + 1}</span>
                      {q.correctOption && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Correct: Option ({q.correctOption.toUpperCase()})
                        </span>
                      )}
                      {q.subjectName && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {q.subjectName}
                        </span>
                      )}
                    </div>

                    <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                      <MathText>{q.questionText}</MathText>
                    </div>

                    {q.questionBengaliText && (
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                        <MathText>{q.questionBengaliText}</MathText>
                      </div>
                    )}

                    {/* 4 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {[
                        { key: 'A', text: q.optionA },
                        { key: 'B', text: q.optionB },
                        { key: 'C', text: q.optionC },
                        { key: 'D', text: q.optionD },
                      ].map((opt) => {
                        const isCorrect = q.correctOption?.toUpperCase() === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={cn(
                              'p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors',
                              isCorrect
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700'
                            )}
                          >
                            <span
                              className={cn(
                                'w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0',
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              )}
                            >
                              {opt.key}
                            </span>
                            <span className="flex-1">
                              <MathText>{opt.text || '—'}</MathText>
                            </span>
                            {isCorrect && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Short Notes / Explanation */}
                    {(q.explanationBengali || q.explanation) && (
                      <div className="pt-1.5">
                        <ShortNotesBox
                          explanation={q.explanationBengali || q.explanation}
                          isMathematics={isMathematicsQuestion(q)}
                          defaultExpanded={false}
                        />
                      </div>
                    )}
                  </div>

                  {/* Marks & Remove Button */}
                  <div className="flex flex-row md:flex-col items-end justify-between md:justify-start gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] uppercase font-black text-slate-400 block">
                        Marks
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={q.marks}
                        disabled={isTestLocked}
                        onChange={(e) => updateQuestionMarks(idx, parseFloat(e.target.value) || 0)}
                        className="w-16 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      disabled={isTestLocked || isSaving}
                      className="disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-rose-200 cursor-pointer"
                      title="Remove question from this Live Test paper"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
