import { Download } from 'lucide-react';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface QuestionBulkActionBarProps {
  qb: AdminQuestionBankState;
}

export function QuestionBulkActionBar({ qb }: QuestionBulkActionBarProps) {
  const {
    selectedRowIds,
    handleBulkStatusChange,
    handleExportSelectedCSV,
    handleBulkDelete,
    setSelectedRowIds,
  } = qb;
  return (
    <>
      {/* BULK SELECTION ACTION BAR */}
      {selectedRowIds.size > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#026BFC] text-white font-bold text-xs flex items-center justify-center">
              {selectedRowIds.size}
            </span>
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
              {selectedRowIds.size} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleBulkStatusChange('published')}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange('draft')}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              Move to Draft
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange('archived')}
              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 cursor-pointer"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={handleExportSelectedCSV}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer"
            >
              Delete Selected ({selectedRowIds.size})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRowIds(new Set())}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs px-2 cursor-pointer font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}
