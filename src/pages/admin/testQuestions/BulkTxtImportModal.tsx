import { CheckCircle2, X, Upload, AlertCircle, Sparkles } from 'lucide-react';
import { SAMPLE_TXT_CONTENT } from '@/utils/txtQuestionParser';
import { Button } from '@/components/common/Button';
import type { MockTest } from '@/types';
import type { AdminTestQuestionsState } from './useAdminTestQuestions';

export interface BulkTxtImportModalProps {
  testQuestionsState: AdminTestQuestionsState;
  test: MockTest;
}

export function BulkTxtImportModal({ testQuestionsState, test }: BulkTxtImportModalProps) {
  const {
    bulkError,
    bulkRawText,
    bulkSuccessMsg,
    handleImportBulk,
    isBulkModalOpen,
    isImportingBulk,
    parsedBulkResult,
    setBulkRawText,
    setIsBulkModalOpen,
    testChapter,
  } = testQuestionsState;
  return (
    <>
      {/* ===================================================================== */}
      {/* 5. MODAL: BULK ADD QUESTIONS VIA TXT                                  */}
      {/* ===================================================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/35 animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#172852] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#152347]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0075FF] to-[#0052E0] text-white flex items-center justify-center shadow-md shadow-[#0075FF]/30 shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Bulk Add Questions via TXT
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target Test:{' '}
                    <strong className="text-slate-800 dark:text-white">{test.title}</strong>
                    {testChapter && ` • Topic: ${testChapter.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-500 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}
            {bulkSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-500 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            {/* TXT Input Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Paste TXT Question Data
                </label>
                <button
                  type="button"
                  onClick={() => setBulkRawText(SAMPLE_TXT_CONTENT)}
                  className="text-[11px] font-bold text-[#0075FF] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Load Sample Format
                </button>
              </div>

              <textarea
                rows={10}
                value={bulkRawText}
                onChange={(e) => setBulkRawText(e.target.value)}
                placeholder="1. ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?&#10;(a) ড. রাজেন্দ্র প্রসাদ&#10;(b) জওহরলাল নেহরু&#10;(c) সর্বপল্লী রাধাকৃষ্ণন&#10;(d) ড. বি. আর. আম্বেদকর&#10;&#10;সঠিক উত্তর: (a) ড. রাজেন্দ্র প্রসাদ"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF] leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Math/equations: wrap LaTeX in <code>$...$</code>, for example{' '}
                <code>{'($^{14}\\text{C}$)'}</code>. Use <code>$$...$$</code> for a centered
                equation.
              </p>
            </div>

            {/* Parse Validation Summary */}
            {parsedBulkResult && (
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#070d1d] border border-slate-200 dark:border-[#172852] flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-400">
                  Detected:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {parsedBulkResult.totalDetected}
                  </strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Valid: {parsedBulkResult.valid.length}
                </span>
                <span className="text-rose-500">Errors: {parsedBulkResult.errors.length}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-[#152347]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBulkModalOpen(false)}
                className="border-slate-300 dark:border-slate-700 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleImportBulk}
                disabled={
                  isImportingBulk || !parsedBulkResult || parsedBulkResult.valid.length === 0
                }
                className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] hover:from-[#026BFC] hover:to-[#0047C7] text-white text-xs font-bold shadow-md shadow-[#0075FF]/30 disabled:opacity-50"
              >
                {isImportingBulk
                  ? 'Importing...'
                  : `Import & Attach ${parsedBulkResult?.valid.length || 0} Questions`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
