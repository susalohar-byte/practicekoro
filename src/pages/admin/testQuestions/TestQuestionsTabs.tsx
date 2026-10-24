import { Layers, Wand2, FolderTree, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { AdminTestQuestionsState } from './useAdminTestQuestions';

export interface TestQuestionsTabsProps {
  testQuestionsState: AdminTestQuestionsState;
}

export function TestQuestionsTabs({ testQuestionsState }: TestQuestionsTabsProps) {
  const {
    activeTab,
    assignedQuestions,
    eligibleBankQuestions,
    handleApplyDefaultsToAll,
    isSectionalOpen,
    liveMode,
    setActiveTab,
    setIsSectionalOpen,
  } = testQuestionsState;
  return (
    <>
      {/* ===================================================================== */}
      {/* 2. TAB CONTROLS: QUESTION SELECTOR vs TEST QUESTIONS                  */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#0a1226] p-1.5 rounded-2xl border border-slate-200 dark:border-[#152347] w-fit">
          {/* A Live Test paper gets fresh uploads only, never questions students may have seen. */}
          {!liveMode && (
            <button
              onClick={() => setActiveTab('select')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'select'
                  ? 'bg-gradient-to-r from-[#0075FF] to-[#0052E0] text-white shadow-md shadow-[#0075FF]/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>+ Add Questions from Topic / Bank</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'select'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-[#152347] text-slate-700 dark:text-slate-300'
                }`}
              >
                {eligibleBankQuestions.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'assigned'
                ? 'bg-gradient-to-r from-[#0075FF] to-[#0052E0] text-white shadow-md shadow-[#0075FF]/25 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Questions in Test</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'assigned'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-[#152347] text-slate-700 dark:text-slate-300'
              }`}
            >
              {assignedQuestions.length}
            </span>
          </button>
        </div>

        {activeTab === 'assigned' && assignedQuestions.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className={`text-xs font-bold transition-all ${
                isSectionalOpen
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
              }`}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />}
              onClick={() => setIsSectionalOpen((v) => !v)}
              title="Bulk assign marks by subject/section"
            >
              Sectional Marking
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-[#0075FF]"
              leftIcon={<Wand2 className="w-3.5 h-3.5 text-amber-500" />}
              onClick={handleApplyDefaultsToAll}
              title="Auto-fill uniform standard scoring across all questions in this test"
            >
              Auto Standard Marks
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
