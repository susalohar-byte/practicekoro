import { Edit2, X } from 'lucide-react';
import { SubscriptionTier, StudentStatus } from './studentTypes';
import type { AdminStudentsState } from './useAdminStudents';

export interface EditStudentModalProps {
  studentsState: AdminStudentsState;
}

export function EditStudentModal({ studentsState }: EditStudentModalProps) {
  const {
    isEditModalOpen,
    selectedStudent,
    setIsEditModalOpen,
    handleEditStudentSubmit,
    editStudentForm,
    setEditStudentForm,
    isWorking,
  } = studentsState;
  return (
    <>
      {/* MODAL 3: EDIT STUDENT MODAL                                         */}
      {/* =================================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#026BFC]" />
                <span>Edit Student: {selectedStudent?.fullName}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditStudentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editStudentForm.fullName}
                  onChange={(e) =>
                    setEditStudentForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editStudentForm.email}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={editStudentForm.phone}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Subscription Plan</label>
                  <select
                    value={editStudentForm.subscriptionPlan}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({
                        ...prev,
                        subscriptionPlan: e.target.value as SubscriptionTier,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="6 Months">6 Months</option>
                    <option value="1 Month">1 Month</option>
                    <option value="1 Year">1 Year</option>
                    <option value="Free">Free</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Status</label>
                  <select
                    value={editStudentForm.status}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({
                        ...prev,
                        status: e.target.value as StudentStatus,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Target Exam</label>
                  <select
                    value={editStudentForm.targetExam}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({ ...prev, targetExam: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="WBP Constable">WBP Constable</option>
                    <option value="KP Constable">KP Constable</option>
                    <option value="WBTET Primary">WBTET Primary</option>
                    <option value="General Science">General Science</option>
                    <option value="SSC CGL">SSC CGL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={editStudentForm.location}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWorking}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
