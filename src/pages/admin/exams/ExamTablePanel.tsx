import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';
import { ExamTableRow } from './ExamTableRow';
import type { AdminExamsState } from './useAdminExams';

export interface ExamTablePanelProps {
  qb: AdminExamsState;
}

export function ExamTablePanel({ qb }: ExamTablePanelProps) {
  const {
    showDetailsPanel,
    selectedExamIds,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginationRange,
    totalPages,
    pagedExams,
    toggleSelectAll,
  } = qb;
  return (
    <>
      {/* Left Column: Table Container */}
      <div
        className={cn(
          'w-full transition-[flex,max-width] duration-200 min-w-0',
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
                        selectedExamIds.size > 0 && selectedExamIds.size === pagedExams.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">#</th>
                  <th className="py-3 px-3 min-w-[200px]">Exam Name</th>
                  <th className="py-3 px-2.5 w-28">Category</th>
                  <th className="py-3 px-2 text-center w-20">Subjects</th>
                  <th className="py-3 px-2 text-center w-24">Full Mocks</th>
                  <th className="py-3 px-2 text-center w-24">Total Tests</th>
                  <th className="py-3 px-3 text-center w-28">Enrollments</th>
                  <th className="py-3 px-2.5 text-center w-24">Status</th>
                  <th className="py-3 px-2.5 text-center w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pagedExams.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No exams found matching current filters.
                    </td>
                  </tr>
                ) : (
                  pagedExams.map((e, index) => (
                    <ExamTableRow key={e.id} qb={qb} e={e} index={index} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls matching screenshot */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {paginationRange.startIndex}–{paginationRange.endIndex} of {totalItems} exams
            </span>

            <div className="flex items-center gap-3">
              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                <button
                  aria-label="Previous page"
                  type="button"
                  disabled={!paginationRange.hasPreviousPage}
                  onClick={() => setCurrentPage(paginationRange.currentPage - 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {getPageNumbers(paginationRange.currentPage, totalPages).map((item, idx) =>
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
                        item === paginationRange.currentPage
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
                  disabled={!paginationRange.hasNextPage}
                  onClick={() => setCurrentPage(paginationRange.currentPage + 1)}
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
