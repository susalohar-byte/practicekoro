import { FolderTree, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { inputCls } from './topicManageUtils';
import type { AdminTopicManageState } from './useAdminTopicManage';

export interface TopicEditorModalProps {
  tm: AdminTopicManageState;
}

export function TopicEditorModal({ tm }: TopicEditorModalProps) {
  const {
    subjects,
    isTopicModalOpen,
    setIsTopicModalOpen,
    editingTopic,
    topicSubjectId,
    setTopicSubjectId,
    topicName,
    topicSlug,
    setTopicSlug,
    topicDescription,
    setTopicDescription,
    topicOrderIndex,
    setTopicOrderIndex,
    topicIsActive,
    setTopicIsActive,
    topicError,
    isSavingTopic,
    handleTopicNameChange,
    handleTopicSubmit,
  } = tm;
  return (
    <>
      {/* ── Create / Edit Topic Modal ──────────────── */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-500" />
                {editingTopic ? 'Edit Topic' : 'Add New Topic'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {topicError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{topicError}</span>
              </div>
            )}

            <form onSubmit={handleTopicSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Parent Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  value={topicSubjectId}
                  onChange={(e) => setTopicSubjectId(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">Select Parent Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => handleTopicNameChange(e.target.value)}
                  placeholder="e.g. Percentage & Profit Loss"
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
                  value={topicSlug}
                  onChange={(e) => setTopicSlug(e.target.value)}
                  placeholder="e.g. percentage-profit-loss"
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  rows={2}
                  placeholder="Short overview of what this topic covers…"
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
                    value={topicOrderIndex}
                    onChange={(e) => setTopicOrderIndex(Number(e.target.value))}
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
                      checked={topicIsActive}
                      onChange={(e) => setTopicIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      Active (visible in tests)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingTopic}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  {isSavingTopic ? 'Saving…' : editingTopic ? 'Update Topic' : 'Create Topic'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
