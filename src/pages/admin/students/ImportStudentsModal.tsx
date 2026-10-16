import { Upload, X, FileSpreadsheet } from 'lucide-react';
import type { AdminStudentsState } from './useAdminStudents';

export interface ImportStudentsModalProps {
  studentsState: AdminStudentsState;
}

export function ImportStudentsModal({ studentsState }: ImportStudentsModalProps) {
  const { isImportModalOpen, setIsImportModalOpen, fileInputRef, handleDownloadSampleCSV } =
    studentsState;
  return (
    <>
      {/* MODAL 2: IMPORT STUDENTS MODAL (CSV Upload & Sample Template)        */}
      {/* =================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#026BFC]" />
                <span>Import Students (CSV)</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Upload a `.csv` file containing student records with name, email, phone, and target
              exam.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30"
            >
              <Upload className="w-8 h-8 text-[#026BFC] mx-auto mb-2 opacity-80" />
              <span className="font-semibold text-xs text-slate-700 block">
                Click to browse or drag and drop CSV
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Supports standard CSV format (Max 5MB)
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="inline-flex items-center gap-1.5 text-xs text-[#026BFC] hover:underline font-medium"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Select File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
