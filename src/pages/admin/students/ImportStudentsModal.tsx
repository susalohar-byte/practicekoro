import { Upload, X, FileSpreadsheet } from 'lucide-react';
import { FileDropZone } from '@/components/common/FileDropZone';
import type { AdminStudentsState } from './useAdminStudents';

export interface ImportStudentsModalProps {
  studentsState: AdminStudentsState;
}

export function ImportStudentsModal({ studentsState }: ImportStudentsModalProps) {
  const { isImportModalOpen, setIsImportModalOpen, handleDownloadSampleCSV, handleCSVImport, isWorking } =
    studentsState;

  return (
    <>
      {/* MODAL 2: IMPORT STUDENTS MODAL (CSV Upload & Sample Template)        */}
      {/* =================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#026BFC]" />
                <span>Import Students (CSV)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Upload a `.csv` file containing student records with name, email, phone, and target
              exam.
            </p>

            <FileDropZone
              accept=".csv"
              disabled={isWorking}
              isProcessing={isWorking}
              onFile={(file) => handleCSVImport(file)}
              label="Click to browse or drag & drop CSV"
              hint="Supports standard CSV format (Max 5MB)"
              buttonLabel="Select CSV File"
              className="py-8"
            />

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="inline-flex items-center gap-1.5 text-xs text-[#026BFC] hover:underline font-medium"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
