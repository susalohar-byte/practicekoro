import { Plus, CheckCircle2, X, Upload, ArrowUpDown } from 'lucide-react';
import type { AdminSubjectsState } from './useAdminSubjects';

export interface SubjectsHeaderProps {
  sb: AdminSubjectsState;
}

export function SubjectsHeader({ sb }: SubjectsHeaderProps) {
  const {
    subjectsList,
    isLoading,
    loadError,
    actionError,
    report,
    isSaving,
    actionSuccessMessage,
    setActionSuccessMessage,
    setIsImportModalOpen,
    setIsOrderModalOpen,
    loadData,
    handleOpenCreateModal,
    setImportRows,
    setImportError,
    setImportSummary,
    setOrderDraft,
    setOrderError,
  } = sb;
  return (
    <>
      {loadError && (
        <div role="alert" className="p-3 rounded-xl border border-rose-200 text-rose-700">
          Subjects unavailable: {loadError}{' '}
          <button onClick={() => void loadData()} className="underline">
            Retry
          </button>
        </div>
      )}
      {actionError && (
        <div role="alert" className="p-3 rounded-xl border border-rose-200 text-rose-700">
          {actionError}
        </div>
      )}
      {report.warnings.map((w) => (
        <p key={w} role="alert" className="text-xs text-amber-700">
          {w}
        </p>
      ))}
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div
          role="status"
          className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs"
        >
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

      {/* 1. Page Header with Title and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Subjects
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and manage subjects. Add topics under each subject for topic tests.
          </p>
        </div>

        {/* Top-Right Action Buttons matching screenshot */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            disabled={isSaving || isLoading || !!loadError}
            onClick={() => {
              setImportError('');
              setImportSummary('');
              setImportRows([]);
              setIsImportModalOpen(true);
            }}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-4 h-4 text-[#026BFC]" />
            Import Subjects
          </button>

          <button
            type="button"
            disabled={isSaving || isLoading || !!loadError}
            onClick={() => {
              setOrderDraft(
                Object.fromEntries(subjectsList.map((s) => [s.id, String(s.orderIndex)]))
              );
              setOrderError('');
              setIsOrderModalOpen(true);
            }}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowUpDown className="w-4 h-4 text-[#026BFC]" />
            Subject Order
          </button>

          <button
            type="button"
            disabled={isSaving || isLoading || !!loadError}
            onClick={handleOpenCreateModal}
            className="h-9 px-4 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Subject
          </button>
        </div>
      </div>
    </>
  );
}
