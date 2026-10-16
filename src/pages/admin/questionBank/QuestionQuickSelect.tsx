import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface QuestionQuickSelectProps {
  qb: AdminQuestionBankState;
}

export function QuestionQuickSelect({ qb }: QuestionQuickSelectProps) {
  const { filteredQuestions, selectedRowIds, setSelectedRowIds } = qb;
  return (
    <>
      {/* QUICK SELECTION CONTROLS */}
      {filteredQuestions.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (selectedRowIds.size === filteredQuestions.length) {
                setSelectedRowIds(new Set());
              } else {
                setSelectedRowIds(new Set(filteredQuestions.map((q) => q.id)));
              }
            }}
            className="px-3 py-1.5 bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            Select All ({filteredQuestions.length}{' '}
            {filteredQuestions.length === 1 ? 'Question' : 'Questions'})
          </button>
        </div>
      )}
    </>
  );
}
