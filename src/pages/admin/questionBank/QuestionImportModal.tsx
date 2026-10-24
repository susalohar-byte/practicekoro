import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSmoothModal } from '@/hooks/useSmoothModal';
import { FileDropZone } from '@/components/common/FileDropZone';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface QuestionImportModalProps {
  qb: AdminQuestionBankState;
}

export function QuestionImportModal({ qb }: QuestionImportModalProps) {
  const {
    isImportModalOpen,
    setIsImportModalOpen,
    setImportMode,
    importMode,
    downloadTemplate,
    importFile,
    processImportFile,
    handleClearImportFile,
    importPreviewStats,
    isImporting,
    handleExecuteImport,
  } = qb;

  const { shouldRender, isAnimating, handleSmoothClose } = useSmoothModal(
    isImportModalOpen,
    () => setIsImportModalOpen(false),
    200
  );

  return (
    <>
      {/* 7. BULK IMPORT MODAL */}
      {shouldRender && (
        <div
          onClick={handleSmoothClose}
          className={cn(
            'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-transparent transition-opacity duration-200 ease-out',
            isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative bg-white border border-slate-300 dark:border-slate-700/90 rounded-3xl w-full max-w-lg p-6 shadow-none transition-all duration-200 ease-out transform space-y-4',
              isAnimating
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
            )}
          >
            {/* Corner Cross Button */}
            <button
              type="button"
              onClick={handleSmoothClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer group"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-4 h-4 transition-transform group-hover:scale-110" />
            </button>

            <div className="flex items-center justify-between pb-3 pr-10 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#026BFC]" />
                Import Questions (Bulk CSV)
              </h3>
            </div>

            {/* Step 1: Select Upload Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Select Upload Mode:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMode('exam')}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                    importMode === 'exam'
                      ? 'bg-blue-50 border-[#026BFC] text-[#026BFC] font-bold'
                      : 'border-slate-200 font-semibold text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <p className="text-xs">By Exam</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Full Mocks & PYQs</p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('subject')}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                    importMode === 'subject'
                      ? 'bg-purple-50 border-purple-500 text-purple-600 font-bold'
                      : 'border-slate-200 font-semibold text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <p className="text-xs">By Subject</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Topic Tests</p>
                </button>
              </div>
            </div>

            {/* Step 2: File Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">2. Upload CSV File:</label>
                <button
                  type="button"
                  onClick={() => downloadTemplate(importMode)}
                  className="text-[11px] font-bold text-[#026BFC] hover:underline cursor-pointer"
                >
                  Download {importMode === 'exam' ? 'Exam' : 'Subject'} Template
                </button>
              </div>

              <FileDropZone
                accept=".csv, .txt"
                disabled={isImporting}
                isProcessing={isImporting}
                onFile={processImportFile}
                selectedFile={importFile}
                onClear={handleClearImportFile}
                label="Choose CSV file or drag & drop here"
                hint="Supports .csv and .txt bulk question files"
                buttonLabel="Browse CSV"
              />
            </div>

            {/* Step 3: Validation Preview */}
            {importPreviewStats && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-900">Validation Preview</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white border">
                    <p className="text-[10px] text-slate-400">Total Rows</p>
                    <p className="text-sm font-bold text-slate-800">{importPreviewStats.total}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700">
                    <p className="text-[10px]">Valid</p>
                    <p className="text-sm font-bold">{importPreviewStats.valid}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-700">
                    <p className="text-[10px]">Errors</p>
                    <p className="text-sm font-bold">{importPreviewStats.errors}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-700">
                    <p className="text-[10px]">Duplicates</p>
                    <p className="text-sm font-bold">{importPreviewStats.duplicates}</p>
                  </div>
                </div>

                {importPreviewStats.errorList.length > 0 && (
                  <div className="mt-2 text-[11px] text-rose-600 space-y-1">
                    {importPreviewStats.errorList.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleSmoothClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importPreviewStats || importPreviewStats.valid === 0 || isImporting}
                onClick={handleExecuteImport}
                className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {isImporting
                  ? 'Importing...'
                  : `Import Valid Questions (${importPreviewStats?.valid || 0})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
