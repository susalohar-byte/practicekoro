import { cn } from '@/lib/utils';
import { Shield, BookOpen, X, AlertTriangle } from 'lucide-react';
import { QuestionBankStatus } from './questionBankUtils';
import { useSmoothModal } from '@/hooks/useSmoothModal';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface AddQuestionModalProps {
  qb: AdminQuestionBankState;
}

export function AddQuestionModal({ qb }: AddQuestionModalProps) {
  const {
    isAddModalOpen,
    modalUploadMode,
    setIsAddModalOpen,
    duplicateWarning,
    setDuplicateWarning,
    handleCreateQuestionSubmit,
    addExam,
    setAddExam,
    addExamQuestionType,
    setAddExamQuestionType,
    addYear,
    setAddYear,
    addPaper,
    setAddPaper,
    addSection,
    setAddSection,
    addSubject,
    setAddSubject,
    addTopic,
    setAddTopic,
    addSubtopic,
    setAddSubtopic,
    addQuestionBengali,
    setAddQuestionBengali,
    checkDuplicate,
    addOptA,
    addOptB,
    addOptC,
    addOptD,
    setAddOptA,
    setAddOptB,
    setAddOptC,
    setAddOptD,
    addCorrect,
    setAddCorrect,
    addExplanation,
    setAddExplanation,
    addMarks,
    setAddMarks,
    addNegativeMarks,
    setAddNegativeMarks,
    addSource,
    setAddSource,
    addTags,
    setAddTags,
    addTagInput,
    setAddTagInput,
    addStatus,
    setAddStatus,
    isSubmittingAdd,
  } = qb;

  const { shouldRender, isAnimating, handleSmoothClose } = useSmoothModal(
    isAddModalOpen,
    () => setIsAddModalOpen(false),
    200
  );

  return (
    <>
      {/* 6. ADD QUESTION MODAL (BY EXAM VS BY SUBJECT) */}
      {shouldRender && (
        <div
          onClick={handleSmoothClose}
          className={cn(
            'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-transparent transition-opacity duration-200 ease-out',
            isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative bg-white dark:bg-[#0A1024] border border-slate-300 dark:border-slate-700/90 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-none transition-all duration-200 ease-out transform',
              isAnimating
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
            )}
          >
            {/* Corner Cross Button */}
            <button
              type="button"
              onClick={handleSmoothClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer group"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-4 h-4 transition-transform group-hover:scale-110" />
            </button>

            <div className="flex items-center justify-between pb-4 pr-12 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-white',
                    modalUploadMode === 'exam' ? 'bg-[#026BFC]' : 'bg-purple-600'
                  )}
                >
                  {modalUploadMode === 'exam' ? (
                    <Shield className="w-5 h-5" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Add Question — {modalUploadMode === 'exam' ? 'By Exam' : 'By Subject'}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    {modalUploadMode === 'exam'
                      ? 'For Full Mock Tests & Official PYQs (Exam specific)'
                      : 'For Topic Tests & Practice (Subject & Topic hierarchy)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Duplicate Warning Alert */}
            {duplicateWarning && (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-900">
                    Possible duplicate detected ({duplicateWarning.similarity}% similarity)
                  </p>
                  <p className="text-amber-800 mt-0.5 line-clamp-2">
                    &quot;{duplicateWarning.existingText}&quot;
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-md font-bold text-[11px] cursor-pointer"
                    >
                      Keep Both
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded-md font-bold text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateQuestionSubmit} className="space-y-4 mt-4 text-xs">
              {/* BY EXAM FIELDS */}
              {modalUploadMode === 'exam' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Exam *
                    </label>
                    <select
                      value={addExam}
                      onChange={(e) => setAddExam(e.target.value)}
                      required
                      className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="WBP Constable">WBP Constable</option>
                      <option value="WBSSC Group C">WBSSC Group C</option>
                      <option value="WBSSC Group D">WBSSC Group D</option>
                      <option value="Railway NTPC">Railway NTPC</option>
                      <option value="ICDS">ICDS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Question Type *
                    </label>
                    <select
                      value={addExamQuestionType}
                      onChange={(e) =>
                        setAddExamQuestionType(e.target.value as 'Full Mock' | 'Official PYQ')
                      }
                      className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="Official PYQ">Official PYQ</option>
                      <option value="Full Mock">Full Mock</option>
                    </select>
                  </div>

                  {addExamQuestionType === 'Official PYQ' && (
                    <>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Year
                        </label>
                        <select
                          value={addYear}
                          onChange={(e) => setAddYear(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold cursor-pointer"
                        >
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                          <option value="2023">2023</option>
                          <option value="2022">2022</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Paper / Set
                        </label>
                        <input
                          type="text"
                          value={addPaper}
                          onChange={(e) => setAddPaper(e.target.value)}
                          placeholder="e.g. Set A or Preliminary"
                          className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Section (Optional)
                    </label>
                    <input
                      type="text"
                      value={addSection}
                      onChange={(e) => setAddSection(e.target.value)}
                      placeholder="e.g. General Awareness, Math"
                      className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              ) : (
                /* BY SUBJECT FIELDS */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/50">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subject *
                    </label>
                    <select
                      value={addSubject}
                      onChange={(e) => setAddSubject(e.target.value)}
                      required
                      className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="General Science">General Science</option>
                      <option value="History">History</option>
                      <option value="Indian Polity">Indian Polity</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Geography">Geography</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Topic *
                    </label>
                    <input
                      type="text"
                      value={addTopic}
                      onChange={(e) => setAddTopic(e.target.value)}
                      required
                      placeholder="e.g. Heat & Temperature"
                      className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subtopic (Optional)
                    </label>
                    <input
                      type="text"
                      value={addSubtopic}
                      onChange={(e) => setAddSubtopic(e.target.value)}
                      placeholder="e.g. Thermodynamics"
                      className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Question (Bengali / English) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={addQuestionBengali}
                  onChange={(e) => {
                    setAddQuestionBengali(e.target.value);
                    checkDuplicate(e.target.value);
                  }}
                  placeholder="যেমন: ভারতের প্রথম গভর্নর-জেনারেল কে ছিলেন?"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#070D1E] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#026BFC] resize-none"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const val =
                    opt === 'A' ? addOptA : opt === 'B' ? addOptB : opt === 'C' ? addOptC : addOptD;
                  const setVal =
                    opt === 'A'
                      ? setAddOptA
                      : opt === 'B'
                        ? setAddOptB
                        : opt === 'C'
                          ? setAddOptC
                          : setAddOptD;

                  return (
                    <div key={opt} className="relative">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          name="correct_opt"
                          checked={addCorrect === opt}
                          onChange={() => setAddCorrect(opt)}
                          id={`radio_${opt}`}
                          className="text-[#026BFC] focus:ring-[#026BFC] cursor-pointer"
                        />
                        <label
                          htmlFor={`radio_${opt}`}
                          className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          Option {opt} {addCorrect === opt && '(Correct Answer)'}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder={`Option ${opt} text`}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-slate-100 font-semibold"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Comprehensive Explanation */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Explanation
                </label>
                <textarea
                  rows={3}
                  value={addExplanation}
                  onChange={(e) => setAddExplanation(e.target.value)}
                  placeholder="Concise explanation of the correct answer..."
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              {/* Marks, Negative Marks & Source */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Marks (+ve)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={addMarks}
                    onChange={(e) => setAddMarks(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Negative Marks (-ve)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={addNegativeMarks}
                    onChange={(e) => setAddNegativeMarks(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Source
                  </label>
                  <select
                    value={addSource}
                    onChange={(e) => setAddSource(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold cursor-pointer"
                  >
                    <option value="Official PYQ">Official PYQ</option>
                    <option value="Original">Original</option>
                    <option value="Reference Book">Reference Book</option>
                    <option value="Mock Test Series">Mock Test Series</option>
                  </select>
                </div>
              </div>

              {/* Tags & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tags (Press Enter to add)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#070D1E] min-h-[42px]">
                    {addTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => setAddTags(addTags.filter((t) => t !== tag))}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={addTagInput}
                      onChange={(e) => setAddTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (addTagInput.trim() && !addTags.includes(addTagInput.trim())) {
                            setAddTags([...addTags, addTagInput.trim()]);
                            setAddTagInput('');
                          }
                        }
                      }}
                      placeholder="Add tag and press Enter..."
                      className="text-xs bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none flex-1 min-w-[120px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as QuestionBankStatus)}
                    className="w-full p-2 bg-white dark:bg-[#070D1E] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl font-semibold cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="under_review">Under Review</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleSmoothClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-6 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold cursor-pointer shadow-xs"
                >
                  {isSubmittingAdd ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
