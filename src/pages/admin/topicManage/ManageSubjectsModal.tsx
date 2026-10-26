import { BookOpen, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { AdminTopicManageState } from './useAdminTopicManage';

export interface ManageSubjectsModalProps {
  tm: AdminTopicManageState;
}

export function ManageSubjectsModal({ tm }: ManageSubjectsModalProps) {
  const {
    subjects,
    chapters,
    setFilterSubjectId,
    isManageSubjectsModalOpen,
    setIsManageSubjectsModalOpen,
    openCreateSubjectModal,
    openEditSubjectModal,
    handleDeleteSubject,
  } = tm;
  return (
    <>
      {/* ── MANAGE SUBJECTS MODAL ────────────────── */}
      {isManageSubjectsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Manage Subjects
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create, edit, and organize subjects without leaving Topic Management
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={openCreateSubjectModal}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Subject
                </Button>
                <button
                  type="button"
                  onClick={() => setIsManageSubjectsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="overflow-y-auto flex-1 border border-slate-100 dark:border-slate-800/80 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">
                      Subject Name
                    </th>
                    <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">
                      Slug
                    </th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-center">
                      Topics
                    </th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-center">
                      Status
                    </th>
                    <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No subjects created yet. Click "Add Subject" to begin.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((sub) => {
                      const topicCount = chapters.filter((c) => c.subjectId === sub.id).length;
                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                              <span>{sub.name}</span>
                            </div>
                            {sub.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                {sub.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {sub.slug}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {sub.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterSubjectId(sub.id);
                                  setIsManageSubjectsModalOpen(false);
                                }}
                                title="Filter topics by this subject"
                                className="px-2 py-1 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-900 transition-colors"
                              >
                                View Topics
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  openEditSubjectModal(sub);
                                }}
                                title="Edit Subject"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(sub)}
                                title="Delete Subject"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-850 shrink-0">
              <span className="text-xs text-slate-500">
                Total {subjects.length} subjects registered
              </span>
              <Button
                variant="outline"
                onClick={() => setIsManageSubjectsModalOpen(false)}
                className="text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
