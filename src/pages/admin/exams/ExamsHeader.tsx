import { Plus, FolderKanban } from 'lucide-react';
import type { AdminExamsState } from './useAdminExams';

export interface ExamsHeaderProps {
  qb: AdminExamsState;
}

export function ExamsHeader({ qb }: ExamsHeaderProps) {
  const { setIsCategoryModalOpen, handleOpenCreateModal } = qb;
  return (
    <>
      {/* 1. Page Header with Title and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Exams
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and manage exams. Organize exams into categories and link subjects.
          </p>
        </div>

        {/* Top-Right Action Buttons matching screenshot */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FolderKanban className="w-4 h-4 text-[#026BFC]" />
            Exam Categories
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-9 px-4 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Exam
          </button>
        </div>
      </div>
    </>
  );
}
