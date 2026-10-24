import { Download, Upload, Plus } from 'lucide-react';
import type { AdminStudentsState } from './useAdminStudents';

export interface StudentsPageHeaderProps {
  studentsState: AdminStudentsState;
}

export function StudentsPageHeader({ studentsState }: StudentsPageHeaderProps) {
  const { handleExportCSV, setIsImportModalOpen, setIsAddModalOpen } = studentsState;
  return (
    <>
      {/* 1. PAGE HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Students</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your students, view their progress, subscriptions and test performance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Export Students Button */}
          <button
            onClick={() => handleExportCSV(false)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Students</span>
          </button>

          {/* Import Students Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Import Students</span>
          </button>

          {/* Add Student Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Student</span>
          </button>
        </div>
      </div>
    </>
  );
}
