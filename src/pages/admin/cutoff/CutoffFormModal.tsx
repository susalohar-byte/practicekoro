import { Plus, X, Edit2 } from 'lucide-react';
import type { CutoffRecordStatus } from './cutoffUtils';
import type { AdminCutoffState } from './useAdminCutoff';

export interface CutoffFormModalProps {
  co: AdminCutoffState;
}

export function CutoffFormModal({ co }: CutoffFormModalProps) {
  const {
    availableExams,
    isAddModalOpen,
    setIsAddModalOpen,
    editingItem,
    formExam,
    setFormExam,
    formYear,
    setFormYear,
    formStage,
    setFormStage,
    formCategory,
    setFormCategory,
    formCutoffMarks,
    setFormCutoffMarks,
    formTotalPosts,
    setFormTotalPosts,
    formStatus,
    setFormStatus,
    formSource,
    setFormSource,
    formNotes,
    setFormNotes,
    handleSaveCutoff,
  } = co;
  return (
    <>
      {/* ==================================================================== */}
      {/* 5. ADD / EDIT CUTOFF MODAL                                           */}
      {/* ==================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-[#2563EB]">
                  {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingItem ? 'Edit Cutoff Record' : 'Add New Cutoff Record'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingItem
                      ? 'Update historical benchmark cutoff parameters'
                      : 'Configure new recruitment cutoff for public publication'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCutoff} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Exam Name
                  </label>
                  <select
                    value={formExam}
                    onChange={(e) => setFormExam(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select an exam</option>
                    {availableExams.map((exam) => (
                      <option key={exam.id} value={exam.title}>
                        {exam.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Exam Year
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Recruitment Stage
                  </label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Final Merit">Final Merit</option>
                    <option value="Preliminary">Preliminary</option>
                    <option value="Mains / Written">Mains / Written</option>
                    <option value="CBT-1">CBT-1</option>
                    <option value="Interview">Interview</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Reservation Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="General">General</option>
                    <option value="OBC-A">OBC-A</option>
                    <option value="OBC-B">OBC-B</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                    <option value="Female (General)">Female (General)</option>
                    <option value="Female (SC)">Female (SC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Visibility Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as CutoffRecordStatus)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="active">Active (visible to students)</option>
                  <option value="draft">Draft (hidden from students)</option>
                  {formStatus === 'archived' && <option value="archived">Archived</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Cutoff Marks (Threshold)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formCutoffMarks}
                    onChange={(e) => setFormCutoffMarks(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. 85.25"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Total Posts / Vacancies
                  </label>
                  <input
                    type="text"
                    required
                    value={formTotalPosts}
                    onChange={(e) => setFormTotalPosts(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. 11,746"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Official Source / Notification
                </label>
                <input
                  type="text"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. WBPRB Notice No. PRB/RECT/2024-89"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Notes & Analysis Context
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Additional remarks or notes for students..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                >
                  {editingItem ? 'Save Changes' : 'Create Cutoff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
