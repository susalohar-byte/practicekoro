import { Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AdminTestQuestionsState } from './useAdminTestQuestions';

export interface SelectTestPromptProps {
  testQuestionsState: AdminTestQuestionsState;
}

export function SelectTestPrompt({ testQuestionsState }: SelectTestPromptProps) {
  const { allTests, currentTestId, handleSelectTest } = testQuestionsState;
  return (
    <>
      <div className="p-8 max-w-md mx-auto text-center space-y-4 bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] rounded-3xl my-12 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-[#0075FF]/15 text-[#0075FF] flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Select a Mock Test</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose a test from the database to manage its question associations.
        </p>
        <select
          value={currentTestId}
          onChange={(e) => handleSelectTest(e.target.value)}
          className="w-full bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#172852] text-xs text-slate-900 dark:text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0075FF] font-medium"
        >
          <option value="">-- Choose a Mock Test --</option>
          {allTests.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.totalQuestions || 0} Qs)
            </option>
          ))}
        </select>
        <div className="pt-2">
          <Link to="/admin/tests" className="text-xs font-bold text-[#0075FF] hover:underline">
            ← Return to Mock Tests List
          </Link>
        </div>
      </div>
    </>
  );
}
