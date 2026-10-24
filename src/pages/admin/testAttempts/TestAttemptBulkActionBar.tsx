import { Download, Trash2 } from 'lucide-react';
import type { AdminTestAttemptsState } from './useAdminTestAttempts';

export interface TestAttemptBulkActionBarProps {
  testAttemptsState: AdminTestAttemptsState;
}

export function TestAttemptBulkActionBar({ testAttemptsState }: TestAttemptBulkActionBarProps) {
  const { selectedRowIds, setSelectedRowIds, handleExportCSV, handleBulkDelete } =
    testAttemptsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 6. FLOATING BULK SELECTION ACTION BAR */}
      {/* ==================================================================== */}
      {selectedRowIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="text-xs font-bold text-slate-200">
            {selectedRowIds.size} attempt{selectedRowIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={() => handleExportCSV(true)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Selected</span>
          </button>
          <button
            onClick={handleBulkDelete}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Invalidate Selected</span>
          </button>
          <button
            onClick={() => setSelectedRowIds(new Set())}
            className="text-xs text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}
    </>
  );
}
