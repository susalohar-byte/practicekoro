import { FolderTree, Edit2, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { AdminTopicManageState } from './useAdminTopicManage';

export interface TopicViewModalProps {
  tm: AdminTopicManageState;
}

export function TopicViewModal({ tm }: TopicViewModalProps) {
  const { viewingTopic, setViewingTopic, subjectMap, questionCountsByTopic, openEditTopicModal } =
    tm;
  return (
    <>
      {/* ── View Topic Details Modal ──────────────── */}
      {viewingTopic && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-500" />
                Topic Details
              </h3>
              <button
                type="button"
                onClick={() => setViewingTopic(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Topic Name</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewingTopic.name}
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Slug</span>
                <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                  {viewingTopic.slug}
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">
                  Parent Subject
                </span>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {subjectMap[viewingTopic.subjectId]?.name || 'Unknown'}
                </p>
              </div>

              {viewingTopic.description && (
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px]">
                    Description
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    {viewingTopic.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Questions</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {questionCountsByTopic[viewingTopic.id] || 0} Questions
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Status</span>
                  <p className="mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        viewingTopic.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${viewingTopic.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      />
                      {viewingTopic.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
              <Button variant="outline" onClick={() => setViewingTopic(null)} className="text-xs">
                Close
              </Button>
              <Button
                onClick={() => {
                  const t = viewingTopic;
                  setViewingTopic(null);
                  openEditTopicModal(t);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Topic
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
