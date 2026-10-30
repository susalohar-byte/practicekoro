import { Plus, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';
import { TopicGroupRows } from './TopicGroupRows';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicsTablePanelProps {
  tp: AdminTopicsState;
}

export function TopicsTablePanel({ tp }: TopicsTablePanelProps) {
  const {
    subjectsList,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    showDetailsPanel,
    selectedTopicIds,
    filteredSubjectGroups,
    allFilteredTopics,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    pagedSubjectGroups,
    toggleSelectAll,
  } = tp;
  return (
    <>
      {/* Left Column: Grouped Topics Table Container */}
      <div
        className={cn(
          'w-full transition-all duration-300 min-w-0',
          showDetailsPanel ? 'lg:flex-1' : 'w-full'
        )}
      >
        <div className="bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 font-medium">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      aria-label="Select all rows"
                      type="checkbox"
                      checked={
                        selectedTopicIds.size > 0 &&
                        selectedTopicIds.size === allFilteredTopics.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">#</th>
                  <th className="py-3 px-3 min-w-[200px]">Topic Name</th>
                  <th className="py-3 px-2.5 w-32">Subject</th>
                  <th className="py-3 px-2 text-center w-24">Total Tests</th>
                  <th className="py-3 px-2 text-center w-28">Total Questions</th>
                  <th className="py-3 px-2.5 text-center w-24">Status</th>
                  <th className="py-3 px-2 text-center w-16">Order</th>
                  <th className="py-3 px-2.5 text-center w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {subjectsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-3">
                        <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                            No subjects created yet
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Topics must belong to a parent Subject. Please create at least one
                            subject in the Subjects section first.
                          </p>
                        </div>
                        <a
                          href="/admin/subjects"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Go to Subjects Page
                        </a>
                      </div>
                    </td>
                  </tr>
                ) : filteredSubjectGroups.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No topics found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  pagedSubjectGroups.map((group) => (
                    <TopicGroupRows key={group.id} tp={tp} group={group} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls matching screenshot */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of {totalItems} subjects (
              {allFilteredTopics.length} total topics)
            </span>

            <div className="flex items-center gap-3">
              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                <button
                  aria-label="Previous page"
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={cn(
                        'min-w-7 h-7 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer',
                        item === currentPage
                          ? 'bg-[#026BFC] text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  aria-label="Next page"
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Page Size Dropdown */}
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value={10}>10 subjects / page</option>
                <option value={25}>25 subjects / page</option>
                <option value={50}>50 subjects / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
