import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useAdminExams } from './exams/useAdminExams';
import { ExamsHeader } from './exams/ExamsHeader';
import { ExamStatCards } from './exams/ExamStatCards';
import { ExamCategoryPills } from './exams/ExamCategoryPills';
import { ExamFilterToolbar } from './exams/ExamFilterToolbar';
import { ExamTablePanel } from './exams/ExamTablePanel';
import { ExamDetailsPanel } from './exams/ExamDetailsPanel';
import { ExamCategoriesModal } from './exams/ExamCategoriesModal';
import { ExamFormModal } from './exams/ExamFormModal';
export { saveExamLogoCache, saveExamOverrideCache } from './exams/examsUtils';

export const AdminExams: React.FC = () => {
  const qb = useAdminExams();
  const {
    isLoading,
    loadError,
    actionSuccessMessage,
    setActionSuccessMessage,
    isModalOpen,
    formError,
    loadData,
  } = qb;
  return withAdminSkeleton(
    isLoading,
    <div className="space-y-4 max-w-[1600px] mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-200">
      {formError && !isModalOpen && (
        <div role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl">
          {formError}
        </div>
      )}
      {loadError && (
        <div role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-800">
          Exam list refresh failed: {loadError}. Any confirmed changes are retained below.
          <button type="button" onClick={() => void loadData()} className="ml-2 underline">
            Retry exam list
          </button>
        </div>
      )}
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <ExamsHeader qb={qb} />

      <ExamStatCards qb={qb} />

      <ExamCategoryPills qb={qb} />

      <ExamFilterToolbar qb={qb} />

      {/* 4. Main Split-Screen Container: Table on Left + Exam Details on Right */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        <ExamTablePanel qb={qb} />

        <ExamDetailsPanel qb={qb} />
      </div>

      <ExamCategoriesModal qb={qb} />

      <ExamFormModal qb={qb} />
    </div>,
    { label: 'Loading exams…', variant: 'table' }
  );
};
