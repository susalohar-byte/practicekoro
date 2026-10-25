import { Upload, ArrowUpDown, Plus, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicsHeaderProps {
  tp: AdminTopicsState;
}

export function TopicsHeader({ tp }: TopicsHeaderProps) {
  const {
    setIsImportModalOpen,
    actionNotice,
    setActionNotice,
    handleOpenCreateModal,
    handleOpenOrderModal,
  } = tp;
  return (
    <>
      {/* 1. Page Header with Title and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Topics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and manage topics under each subject. Topics are used to create Topic Tests.
          </p>
        </div>

        {/* Top-Right Action Buttons matching screenshot */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-4 h-4 text-[#026BFC]" />
            Import Topics
          </button>

          <button
            type="button"
            onClick={handleOpenOrderModal}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowUpDown className="w-4 h-4 text-[#026BFC]" />
            Topic Order
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="h-9 px-4 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Topic
          </button>
        </div>
      </div>

      {/* Action Notice Notification Banner */}
      {actionNotice && (
        <div
          className={cn(
            'p-3 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs',
            actionNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : actionNotice.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          )}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' && (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            {actionNotice.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            {actionNotice.type === 'info' && (
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
