import { Trash2 } from 'lucide-react';
import type { AdminStudentsState } from './useAdminStudents';

export interface DeleteStudentModalProps {
  studentsState: AdminStudentsState;
}

export function DeleteStudentModal({ studentsState }: DeleteStudentModalProps) {
  const {
    isDeleteModalOpen,
    selectedStudent,
    setIsDeleteModalOpen,
    handleDeleteStudent,
    isWorking,
  } = studentsState;
  return (
    <>
      {/* MODAL 6: DELETE STUDENT MODAL                                       */}
      {/* =================================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Delete Student</h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-slate-800">"{selectedStudent?.fullName}"</span>?
              All attempt histories and subscription access will be revoked.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={isWorking}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
