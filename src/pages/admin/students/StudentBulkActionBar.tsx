import { Download, Trash2 } from 'lucide-react';
import type { AdminStudentsState } from './useAdminStudents';

export interface StudentBulkActionBarProps {
  studentsState: AdminStudentsState;
}

export function StudentBulkActionBar({ studentsState }: StudentBulkActionBarProps) {
  const { selectedRowIds, handleExportCSV, handleBulkDelete, isWorking, setSelectedRowIds } =
    studentsState;
  return (
    <>
      {/* Floating Bulk Action Bar if rows are checked */}
      {selectedRowIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between mb-4 animate-in slide-in-from-top-2 text-xs">
          <span className="font-semibold text-slate-200">
            {selectedRowIds.length} student{selectedRowIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportCSV(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Selected</span>
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isWorking}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedRowIds([])}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}
