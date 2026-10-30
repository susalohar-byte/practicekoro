import { AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import {
  Radio,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Copy,
  StopCircle,
  Play,
  Monitor,
  ListChecks,
  Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';
import { formatScheduledDate } from './liveTestsUtils';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestsTablePanelProps {
  live: AdminLiveTestsState;
}

export function LiveTestsTablePanel({ live }: LiveTestsTablePanelProps) {
  const {
    statsById,
    loading,
    setSelectedTestId,
    selectedIds,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    isDrawerOpen,
    setIsDrawerOpen,
    setIsCreateModalOpen,
    setEditingTest,
    setDeleteCandidate,
    setEndCandidate,
    activeMenuId,
    setActiveMenuId,
    filteredTests,
    totalPages,
    paginatedTests,
    selectedLiveTest,
    handleSelectAll,
    handleToggleSelectRow,
    handleDuplicate,
    openPaperQuestions,
    handleReleaseToPractice,
    handleStartLiveNow,
  } = live;
  return (
    <>
      {/* Main Table Container */}
      <div
        className={cn(
          'w-full transition-all duration-300 min-w-0',
          isDrawerOpen && selectedLiveTest ? 'lg:flex-1' : 'w-full'
        )}
      >
        <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto min-h-[340px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-8 text-center">
                    <input
                      aria-label="Select all rows"
                      type="checkbox"
                      checked={
                        paginatedTests.length > 0 &&
                        paginatedTests.every((t) => selectedIds.has(t.id))
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center text-slate-400">#</th>
                  <th className="py-3 px-3">Test Name</th>
                  <th className="py-3 px-3">Exam</th>
                  <th className="py-3 px-3">Scheduled Date & Time</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Participants</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-4">
                      <AdminSectionSkeleton label="Loading live tests..." variant="table" />
                    </td>
                  </tr>
                ) : paginatedTests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Radio className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">No live tests found</p>
                        <p className="text-xs text-slate-400">
                          Try adjusting your filters or create a new live test
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTests.map((test, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    const isRowChecked = selectedIds.has(test.id);
                    const isRowActive = isDrawerOpen && selectedLiveTest?.id === test.id;
                    const schedDate = formatScheduledDate(test.scheduledStartTime || test.startAt);

                    return (
                      <tr
                        key={test.id}
                        onClick={() => {
                          setSelectedTestId(test.id);
                          setIsDrawerOpen(true);
                        }}
                        className={cn(
                          'hover:bg-slate-50/80 transition-colors cursor-pointer group',
                          isRowChecked && 'bg-blue-50/30',
                          isRowActive &&
                            'bg-blue-50/70 ring-1 ring-inset ring-blue-500/30 font-medium'
                        )}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3.5 px-3 text-center"
                          onClick={(e) => handleToggleSelectRow(test.id, e)}
                        >
                          <input
                            aria-label="Select row"
                            type="checkbox"
                            checked={selectedIds.has(test.id)}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                        </td>

                        {/* Index # */}
                        <td className="py-3.5 px-2 text-center text-xs text-slate-400 font-medium">
                          {rowNumber}
                        </td>

                        {/* Test Name + Emblem + Sub-badge */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center p-1">
                              <img
                                src={test.logo || test.examLogo || '/images/exams/logo_wbp.png'}
                                alt={test.title}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {test.title}
                              </div>
                              <div className="mt-0.5">
                                <span className="inline-block text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.2 rounded">
                                  Full Mock Test
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Exam */}
                        <td className="py-3.5 px-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                          {test.examTitle || test.test?.examTitle || '—'}
                        </td>

                        {/* Scheduled Date & Time */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {schedDate ? (
                            <div>
                              <div className="text-xs font-medium text-slate-800">
                                {schedDate.date}
                              </div>
                              <div className="text-[11px] text-slate-400">{schedDate.time}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">—</span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                          {test.durationMinutes || 60} min
                        </td>

                        {/* Participants */}
                        <td className="py-3.5 px-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                          {(statsById[test.id]?.participants || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {test.status === 'live' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                              <Radio className="w-3 h-3 text-rose-600 animate-pulse" />
                              <span>Live Now</span>
                            </span>
                          )}
                          {(test.status === 'upcoming' || test.status === 'scheduled') && (
                            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                              Scheduled
                            </span>
                          )}
                          {test.status === 'draft' && (
                            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                              Draft
                            </span>
                          )}
                          {(test.status === 'ended' || test.status === 'completed') && (
                            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Completed
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-3 text-right relative action-menu-container"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === test.id ? null : test.id);
                            }}
                            className={cn(
                              'p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer',
                              activeMenuId === test.id &&
                                'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 ring-2 ring-blue-500/20'
                            )}
                            title="Actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeMenuId === test.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-2 top-10 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-40 text-left text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTestId(test.id);
                                  setIsDrawerOpen(true);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Monitor className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="font-semibold">View Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  openPaperQuestions(test);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5">
                                  <ListChecks className="w-4 h-4 text-indigo-600 shrink-0" />
                                  <span className="font-semibold">
                                    {test.status === 'draft'
                                      ? 'Upload Questions'
                                      : 'View Questions'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {test.test?.totalQuestions ?? test.totalQuestions ?? 0}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTest(test);
                                  setIsCreateModalOpen(true);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Edit className="w-4 h-4 text-slate-500 shrink-0" />
                                <span>Edit Test</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleDuplicate(test);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Copy className="w-4 h-4 text-purple-600 shrink-0" />
                                <span>Duplicate Test</span>
                              </button>

                              {/* Contextual actions */}
                              {test.status !== 'live' &&
                                test.status !== 'ended' &&
                                test.status !== 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleStartLiveNow(test);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                                  >
                                    <Play className="w-4 h-4 shrink-0" />
                                    <span>Start Live Now</span>
                                  </button>
                                )}

                              {(test.status === 'ended' ||
                                test.status === 'completed' ||
                                test.status === 'cancelled') &&
                                test.test?.isLiveOnly && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleReleaseToPractice(test);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                                  >
                                    <Unlock className="w-4 h-4 shrink-0" />
                                    <span>Release to Practice</span>
                                  </button>
                                )}

                              {test.status === 'live' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEndCandidate(test);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                                >
                                  <StopCircle className="w-4 h-4 shrink-0" />
                                  <span>End Live Test</span>
                                </button>
                              )}

                              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteCandidate(test);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 shrink-0" />
                                <span>Delete Test</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Matching Reference */}
          <div className="py-4 px-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {filteredTests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filteredTests.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{filteredTests.length}</span> live
              tests
            </div>

            <div className="flex items-center gap-1">
              <button
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={cn(
                      'min-w-7 h-7 px-2 rounded-md font-medium text-xs transition-colors cursor-pointer',
                      currentPage === item
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
