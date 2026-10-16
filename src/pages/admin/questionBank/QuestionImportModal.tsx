import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    handleFileChange,
    importPreviewStats,
    isImporting,
    handleExecuteImport,
  } = qb;
  return (
    <>
      {/* 7. BULK IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#026BFC]" />
                Import Questions (Bulk CSV)
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
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

              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center bg-slate-50 relative">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {importFile ? importFile.name : 'Choose CSV file (.csv)'}
                </p>
                <input
                  type="file"
                  accept=".csv, .txt"
                  onChange={handleFileChange}
                  className="mt-2 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold cursor-pointer"
                />
              </div>
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
                onClick={() => setIsImportModalOpen(false)}
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
