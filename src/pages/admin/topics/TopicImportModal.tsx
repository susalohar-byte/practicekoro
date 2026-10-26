import { Upload, X, HelpCircle } from 'lucide-react';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicImportModalProps {
  tp: AdminTopicsState;
}

export function TopicImportModal({ tp }: TopicImportModalProps) {
  const { isImportModalOpen, setIsImportModalOpen } = tp;
  return (
    <>
      {/* 7. IMPORT TOPICS MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0A1024] rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Import Topics
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload CSV or JSON file containing syllabus topics
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-900/30">
                <Upload className="w-8 h-8 text-[#026BFC] mx-auto mb-2" />
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Click to upload or drag & drop
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported formats: CSV, XLSX, JSON (Max 5MB)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[#026BFC] text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Format Requirements
                </p>
                <p className="text-slate-600">
                  Columns: <code>Topic Name</code>, <code>Subject</code>, <code>Order</code>,{' '}
                  <code>Description</code>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Demo file validated! 12 new topics prepared for import.');
                    setIsImportModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold shadow-2xs"
                >
                  Upload & Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
