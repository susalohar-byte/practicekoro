import { Plus, X } from 'lucide-react';
import { isMathematicsSubject } from '@/utils/shortNotes';
import { Button } from '@/components/common/Button';
import type { MockTest } from '@/types';
import type { AdminTestQuestionsState } from './useAdminTestQuestions';

export interface CreateQuestionModalProps {
  testQuestionsState: AdminTestQuestionsState;
  test: MockTest;
}

export function CreateQuestionModal({ testQuestionsState, test }: CreateQuestionModalProps) {
  const {
    createError,
    handleCreateQuestion,
    isBilingualEnabled,
    isCreateModalOpen,
    isCreating,
    newCorrectOption,
    newExplanation,
    newMarks,
    newOptionA,
    newOptionB,
    newOptionC,
    newOptionD,
    newQuestionBengali,
    newQuestionText,
    setIsCreateModalOpen,
    setNewCorrectOption,
    setNewExplanation,
    setNewMarks,
    setNewOptionA,
    setNewOptionB,
    setNewOptionC,
    setNewOptionD,
    setNewQuestionBengali,
    setNewQuestionText,
  } = testQuestionsState;
  return (
    <>
      {/* ===================================================================== */}
      {/* 6. MODAL: CREATE SINGLE QUESTION DIRECTLY                             */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/35 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#172852] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#152347]">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Create Question for {test.title}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-bold">
                {createError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              {!isBilingualEnabled ? (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Question Text (বাংলা প্রশ্ন) *
                  </label>
                  <textarea
                    rows={3}
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                    placeholder="সম্পূর্ণ প্রশ্নটি বাংলা ভাষায় লিখুন..."
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Question Text (English) *
                    </label>
                    <textarea
                      rows={2}
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                      placeholder="Enter question text in English"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Question Text (Bengali)
                    </label>
                    <textarea
                      rows={2}
                      value={newQuestionBengali}
                      onChange={(e) => setNewQuestionBengali(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                      placeholder="বাংলায় প্রশ্ন লিখুন (ঐচ্ছিক)"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Option A *
                  </label>
                  <input
                    type="text"
                    value={newOptionA}
                    onChange={(e) => setNewOptionA(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Option B *
                  </label>
                  <input
                    type="text"
                    value={newOptionB}
                    onChange={(e) => setNewOptionB(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Option C *
                  </label>
                  <input
                    type="text"
                    value={newOptionC}
                    onChange={(e) => setNewOptionC(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Option D *
                  </label>
                  <input
                    type="text"
                    value={newOptionD}
                    onChange={(e) => setNewOptionD(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Correct Answer *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setNewCorrectOption(opt)}
                      className={`py-2 rounded-xl font-bold transition-all ${
                        newCorrectOption === opt
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#070d1d] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      ({opt.toLowerCase()})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                    {isMathematicsSubject(test?.subjectId, {
                      chapterName: test?.title,
                      title: test?.title,
                    })
                      ? 'Explanation / গাণিতিক সমাধান'
                      : 'Short Notes (শর্ট নোটস) - Bengali Bullet Points'}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isMathematicsSubject(test?.subjectId, {
                      chapterName: test?.title,
                      title: test?.title,
                    })
                      ? 'Steps & Formula'
                      : '4–5 bullets starting with •'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF] font-normal text-xs leading-relaxed"
                  placeholder={
                    isMathematicsSubject(test?.subjectId, {
                      chapterName: test?.title,
                      title: test?.title,
                    })
                      ? 'Step-by-step mathematical explanation, formulas, and working...'
                      : '• পয়েন্ট ১...\n• পয়েন্ট ২...\n• পয়েন্ট ৩...\n• পয়েন্ট ৪...\n• পয়েন্ট ৫...'
                  }
                />
                {!isMathematicsSubject(test?.subjectId, {
                  chapterName: test?.title,
                  title: test?.title,
                }) && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    প্রতিটি বুলেট নতুন লাইনে '• ' দিয়ে শুরু করুন (৪–৫টি তথ্যবহুল পয়েন্ট)। কোনো
                    "সঠিক উত্তর" বা অপশন ঘোষণা লিখবেন না।
                  </p>
                )}
              </div>

              <div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={newMarks}
                    onChange={(e) => setNewMarks(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#152347]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="border-slate-300 dark:border-slate-700 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreateQuestion}
                disabled={isCreating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create & Attach to Test'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
