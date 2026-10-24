import { Plus, X } from 'lucide-react';
import { SubscriptionTier } from './studentTypes';
import type { AdminStudentsState } from './useAdminStudents';

export interface AddStudentModalProps {
  studentsState: AdminStudentsState;
}

export function AddStudentModal({ studentsState }: AddStudentModalProps) {
  const {
    isAddModalOpen,
    setIsAddModalOpen,
    handleAddStudentSubmit,
    newStudentForm,
    setNewStudentForm,
    isWorking,
  } = studentsState;
  return (
    <>
      {/* MODAL 1: ADD STUDENT MODAL                                          */}
      {/* =================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#026BFC]" />
                  <span>Add New Student</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter student credentials and assign subscription plan.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleAddStudentSubmit}
              className="p-6 overflow-y-auto space-y-3.5 text-xs flex-1"
            >
              <div>
                <label className="block text-slate-600 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suman Mondal"
                  value={newStudentForm.fullName}
                  onChange={(e) =>
                    setNewStudentForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    value={newStudentForm.email}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={newStudentForm.phone}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Subscription Plan</label>
                  <select
                    value={newStudentForm.subscriptionPlan}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({
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
                  <label className="block text-slate-600 font-medium mb-1">Target Exam</label>
                  <select
                    value={newStudentForm.targetExam}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({ ...prev, targetExam: e.target.value }))
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
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Location / District</label>
                <input
                  type="text"
                  placeholder="Kolkata, West Bengal"
                  value={newStudentForm.location}
                  onChange={(e) =>
                    setNewStudentForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWorking}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
