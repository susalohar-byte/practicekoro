import {
  FolderTree,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import { getBadgeColor, formatDate, ITEMS_PER_PAGE, cardCls } from './topicManageUtils';
import type { AdminTopicManageState } from './useAdminTopicManage';

export interface TopicManageTableProps {
  tm: AdminTopicManageState;
}

export function TopicManageTable({ tm }: TopicManageTableProps) {
  const {
    isLoading,
    search,
    filterSubjectId,
    filterStatus,
    setCurrentPage,
    setViewingTopic,
    subjectMap,
    subjectOrderMap,
    questionCountsByTopic,
    filteredTopics,
    totalPages,
    safePage,
    pagedTopics,
    openEditTopicModal,
    handleDeleteTopic,
    navigateToTopicQuestions,
    getPageNumbers,
  } = tm;
  return (
    <>
      {/* ── Table View ────────────────────────────── */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/90 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">#</th>
                <th className="px-4 py-3.5">Topic Name</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5 text-center">Questions</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Updated On</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <AdminSectionSkeleton label="Loading topics…" variant="table" />
                  </td>
                </tr>
              ) : pagedTopics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <FolderTree className="w-10 h-10 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No topics found
                      </p>
                      <p className="text-xs text-slate-400 text-center">
                        {search || filterSubjectId !== 'all' || filterStatus !== 'all'
                          ? 'Try adjusting your search or filters to find what you are looking for.'
                          : 'Get started by creating your first academic topic.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedTopics.map((topic, index) => {
                  const sub = subjectMap[topic.subjectId];
                  const subIdx = subjectOrderMap[topic.subjectId] ?? 0;
                  const badgeColor = getBadgeColor(topic.subjectId, subIdx);
                  const qCount = questionCountsByTopic[topic.id] || 0;
                  const rowNum = (safePage - 1) * ITEMS_PER_PAGE + index + 1;

                  return (
                    <tr
                      key={topic.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors group"
                    >
                      {/* Row number */}
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono text-[11px]">
                        {rowNum}
                      </td>

                      {/* Topic Name */}
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{topic.name}</span>
                        </div>
                      </td>

                      {/* Subject Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}
                        >
                          {sub?.name || 'Unknown Subject'}
                        </span>
                      </td>

                      {/* Questions Count */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigateToTopicQuestions(topic.subjectId, topic.id)}
                          title="View questions for this topic"
                          className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>{qCount}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            topic.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${topic.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                          />
                          {topic.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Updated On */}
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap font-mono">
                        {formatDate(topic.updatedAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingTopic(topic)}
                            title="View topic details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditTopicModal(topic)}
                            title="Edit topic"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(topic)}
                            title="Delete topic"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* ── Pagination ────────────────────────────── */}
        {!isLoading && filteredTopics.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200/90 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(safePage - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.min(safePage * ITEMS_PER_PAGE, filteredTopics.length)}
              </span>{' '}
              of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {filteredTopics.length}
              </span>{' '}
              topics
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p as number)}
                    className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      safePage === p
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
