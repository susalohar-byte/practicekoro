import { BookOpen, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { inputCls } from './topicManageUtils';
import type { AdminTopicManageState } from './useAdminTopicManage';

export interface SubjectEditorModalProps {
  tm: AdminTopicManageState;
}

export function SubjectEditorModal({ tm }: SubjectEditorModalProps) {
  const {
    isSubjectModalOpen,
    setIsSubjectModalOpen,
    editingSubject,
    subName,
    subSlug,
    setSubSlug,
    subDescription,
    setSubDescription,
    subOrderIndex,
    setSubOrderIndex,
    subIsActive,
    setSubIsActive,
    subError,
    isSavingSubject,
    handleSubNameChange,
    handleSubjectSubmit,
  } = tm;
  return (
    <>
      {/* ── Create / Edit Subject Modal ────────────── */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {subError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{subError}</span>
              </div>
            )}

            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => handleSubNameChange(e.target.value)}
                  placeholder="e.g. Mathematics & Quantitative Aptitude"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={subSlug}
                  onChange={(e) => setSubSlug(e.target.value)}
                  placeholder="e.g. mathematics"
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={subDescription}
                  onChange={(e) => setSubDescription(e.target.value)}
                  rows={2}
                  placeholder="Short description of this subject…"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Order Index
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={subOrderIndex}
                    onChange={(e) => setSubOrderIndex(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <label className="flex items-center gap-2.5 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subIsActive}
                      onChange={(e) => setSubIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingSubject}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  {isSavingSubject
                    ? 'Saving…'
                    : editingSubject
                      ? 'Update Subject'
                      : 'Create Subject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
