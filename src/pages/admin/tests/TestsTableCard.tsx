import {
  FileText,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';
import type { TestTypeTab } from './testTypes';
import { renderRowIcon } from './testRowIcon';
import { TestFilterToolbar } from './TestFilterToolbar';
import type { AdminTestsState } from './useAdminTests';

export interface TestsTableCardProps {
  testsState: AdminTestsState;
}

export function TestsTableCard({ testsState }: TestsTableCardProps) {
  const {
    tests,
    isLoading,
    activeTab,
    selectedTestIds,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    selectedTest,
    setSelectedTest,
    showDetailsPanel,
    setShowDetailsPanel,
    setDetailsTab,
    openActionMenuId,
    setOpenActionMenuId,
    setIsPreviewModalOpen,
    setPreviewTest,
    setIsAddQuestionsModalOpen,
    handleTabChange,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    pagedTests,
    toggleSelectAll,
    toggleSelectTest,
    handleSelectRow,
    handleDeleteTest,
    handleDuplicateTest,
  } = testsState;
  return (
    <>
      {/* Left Column: Table Container */}
      <div
        className={cn(
          'w-full transition-all duration-300 min-w-0',
          showDetailsPanel ? 'lg:flex-1' : 'w-full'
        )}
      >
        <div className="bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs overflow-hidden">
          {/* Horizontal Tabs: All Tests, Full Mock, Topic Test, Official PYQ (live counts) */}
          <div className="px-5 pt-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-8 overflow-x-auto">
            {[
              { key: 'all', label: `All Tests (${tests.length})` },
              {
                key: 'full_mock',
                label: `Full Mock (${tests.filter((t) => t.testType === 'full_mock').length})`,
              },
              {
                key: 'topic',
                label: `Topic Test (${tests.filter((t) => t.testType === 'topic').length})`,
              },
              {
                key: 'pyq',
                label: `Official PYQ (${tests.filter((t) => t.testType === 'pyq').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key as TestTypeTab)}
                className={cn(
                  'pb-3 text-xs tracking-tight transition-all relative font-medium shrink-0',
                  activeTab === tab.key
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                <span>{tab.label}</span>
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <TestFilterToolbar testsState={testsState} />

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#070D1E]/60 text-slate-700 dark:text-slate-300 font-bold text-xs">
                  <th className="py-3 px-3 w-8 text-center">
                    <input
                      aria-label="Select all rows"
                      type="checkbox"
                      checked={pagedTests.length > 0 && selectedTestIds.size === pagedTests.length}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">#</th>
                  <th className="py-3 px-3 min-w-[200px]">Test Name</th>
                  <th className="py-3 px-2.5 w-24">Type</th>
                  <th className="py-3 px-2.5 min-w-[110px]">Exam / Subject</th>
                  <th className="py-3 px-2.5 min-w-[110px]">Topic (for Topic Test)</th>
                  <th className="py-3 px-2 text-center w-20">Questions</th>
                  <th className="py-3 px-2 text-center w-20">Duration</th>
                  <th className="py-3 px-2.5 w-24">Status</th>
                  <th className="py-3 px-2.5 w-12 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLoading && pagedTests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-4">
                      <AdminSectionSkeleton label="Loading tests..." variant="table" />
                    </td>
                  </tr>
                ) : pagedTests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No tests found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  pagedTests.map((t, idx) => {
                    const isChecked = selectedTestIds.has(t.id);
                    const isSelected = selectedTest?.id === t.id;
                    const isPublished = t.status === 'published';
                    const isUnderReview = t.status === 'archived';

                    const isFullMock = t.testType === 'full_mock';
                    const isTopic = t.testType === 'topic';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleSelectRow(t)}
                        className={cn(
                          'group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 select-none',
                          isSelected
                            ? 'bg-blue-50/60 dark:bg-blue-950/25 ring-1 ring-blue-500/20'
                            : isChecked
                              ? 'bg-slate-50/60 dark:bg-slate-800/20'
                              : ''
                        )}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            aria-label="Select row"
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => toggleSelectTest(t.id, e)}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                          />
                        </td>

                        {/* Index */}
                        <td className="py-3 px-2 text-center text-slate-400 text-[11px]">
                          {startIndex + idx + 1}
                        </td>

                        {/* Test Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {renderRowIcon(t)}
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                                {t.title}
                              </span>
                              <span
                                className={cn(
                                  'text-[9.5px] font-semibold block',
                                  isFullMock
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : isTopic
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-500 dark:text-rose-400'
                                )}
                              >
                                {isFullMock ? 'Full Mock' : isTopic ? 'Topic Test' : 'Official PYQ'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-2.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[11px] font-medium tracking-tight inline-block',
                              isFullMock
                                ? 'bg-[#EBF5FF] text-[#026BFC] dark:bg-blue-950/60 dark:text-blue-300'
                                : isTopic
                                  ? 'bg-[#E8F8F0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-[#FEECEC] text-[#EF4444] dark:bg-rose-950/60 dark:text-rose-300'
                            )}
                          >
                            {isFullMock ? 'Full Mock' : isTopic ? 'Topic Test' : 'Official PYQ'}
                          </span>
                        </td>

                        {/* Exam / Subject */}
                        <td className="py-3 px-2.5 text-slate-600 dark:text-slate-300 font-normal">
                          {isTopic
                            ? t.subjectName || 'General Science'
                            : t.examTitle || 'WBP Constable'}
                        </td>

                        {/* Topic (for Topic Test) */}
                        <td className="py-3 px-2.5 text-slate-500 dark:text-slate-400">
                          {isTopic ? t.chapterName || '—' : '—'}
                        </td>

                        {/* Questions */}
                        <td className="py-3 px-2 text-center text-slate-700 dark:text-slate-300">
                          {t.totalQuestions ?? '—'}
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-2 text-center text-slate-500 dark:text-slate-400">
                          {t.durationMinutes} min
                        </td>

                        {/* Status */}
                        <td className="py-3 px-2.5">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-xs font-medium inline-block',
                              isPublished
                                ? 'bg-[#E8F8F0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-[#FEF8E7] text-[#D97706] dark:bg-amber-950/60 dark:text-amber-300'
                            )}
                          >
                            {isPublished ? 'Published' : isUnderReview ? 'Under Review' : 'Draft'}
                          </span>
                        </td>

                        {/* Actions Menu */}
                        <td
                          className="py-3 px-2.5 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            aria-label="More actions"
                            type="button"
                            onClick={() =>
                              setOpenActionMenuId(openActionMenuId === t.id ? null : t.id)
                            }
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            <MoreHorizontal className="w-4 h-4 text-slate-500" />
                          </button>

                          {openActionMenuId === t.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setOpenActionMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-1 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleSelectRow(t);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                                  View Details
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setSelectedTest(t);
                                    setShowDetailsPanel(true);
                                    setDetailsTab('settings');
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                  Edit Test & Icon
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setPreviewTest(t);
                                    setIsPreviewModalOpen(true);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                >
                                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                                  Preview Test
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setSelectedTest(t);
                                    setIsAddQuestionsModalOpen(true);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                >
                                  <Plus className="w-3.5 h-3.5 text-cyan-500" />
                                  Manage Questions
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleDuplicateTest(t.id);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-amber-500" />
                                  Duplicate Test
                                </button>

                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    if (
                                      confirm(
                                        `Are you sure you want to delete mock test "${t.title}"?`
                                      )
                                    ) {
                                      handleDeleteTest(t.id);
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete Test
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 dark:text-slate-400">
              Showing {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of {totalItems} tests
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  aria-label="Previous page"
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40"
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
                        'min-w-7 h-7 px-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center',
                        currentPage === item
                          ? 'bg-[#026BFC] text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40"
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
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-300"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
