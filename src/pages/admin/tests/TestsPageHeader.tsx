import { Upload, Download, Plus } from 'lucide-react';
import type { AdminTestsState } from './useAdminTests';

export interface TestsPageHeaderProps {
  testsState: AdminTestsState;
}

export function TestsPageHeader({ testsState }: TestsPageHeaderProps) {
  const { activeTab, setIsImportModalOpen, handleOpenCreateModal, handleDownloadTemplate } =
    testsState;
  return (
    <>
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mock Test Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, edit and manage mock tests for exams and subject topics.
          </p>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#026BFC]" />
            Import Tests
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#026BFC]" />
            Download Template
          </button>

          <button
            type="button"
            onClick={() =>
              handleOpenCreateModal(
                activeTab === 'topic' ? 'topic' : activeTab === 'pyq' ? 'pyq' : 'full_mock'
              )
            }
            className="h-9 px-4 rounded-lg bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Mock Test
          </button>
        </div>
      </div>
    </>
  );
}
