import React from 'react';
import {
  Edit2,
  Trash2,
  FileText,
  MoreHorizontal,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';
import { SubjectIconBadge } from './SubjectIconBadge';
import type { AdminSubjectsState } from './useAdminSubjects';

export interface SubjectTablePanelProps {
  sb: AdminSubjectsState;
}

export function SubjectTablePanel({ sb }: SubjectTablePanelProps) {
  const {
    isLoading,
    loadError,
    selectedSubject,
    showDetailsPanel,
    selectedSubjectIds,
    openActionMenuId,
    setOpenActionMenuId,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    pagedSubjects,
    toggleSelectAll,
    toggleSelectRow,
    handleSelectSubjectRow,
    handleOpenEditModal,
    handleDeleteSubject,
    handleDuplicateSubject,
  } = sb;
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
          {/* Table */}
          <div className="overflow-x-auto">
            <table aria-label="Subjects" className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 font-medium">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select current page"
                      checked={
                        pagedSubjects.length > 0 &&
                        pagedSubjects.every((s) => selectedSubjectIds.has(s.id))
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">#</th>
                  <th className="py-3 px-3 min-w-[200px]">Subject Name</th>
                  <th className="py-3 px-2.5 w-28">Category</th>
                  <th className="py-3 px-2 text-center w-20">Topics</th>
                  <th className="py-3 px-2 text-center w-24">Topic Tests</th>
                  <th className="py-3 px-3 text-center w-28">Total Questions</th>
                  <th className="py-3 px-2.5 text-center w-24">Status</th>
                  <th className="py-3 px-2.5 text-center w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pagedSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      {isLoading
                        ? 'Loading subjects…'
                        : loadError
                          ? 'Subjects could not be loaded.'
                          : 'No subjects found matching current filters.'}
                    </td>
                  </tr>
                ) : (
                  pagedSubjects.map((s, index) => {
                    const rowNumber = startIndex + index + 1;
                    const isSelected = Boolean(showDetailsPanel && selectedSubject?.id === s.id);
                    const isChecked = selectedSubjectIds.has(s.id);
                    const isPublished = s.statusLabel === 'Published';

                    return (
                      <tr
                        key={s.id}
                        onClick={() => handleSelectSubjectRow(s)}
                        className={cn(
                          'transition-colors cursor-pointer group',
                          isSelected
                            ? 'bg-blue-50/40 dark:bg-blue-950/20 outline outline-1 outline-[#026BFC] -outline-offset-1'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
                        )}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3.5 px-3 text-center"
                          onClick={(evt) => evt.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            aria-label={`Select ${s.name}`}
                            checked={isChecked}
                            onChange={(evt) =>
                              toggleSelectRow(s.id, evt as unknown as React.MouseEvent)
                            }
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                        </td>

                        {/* Row Index */}
                        <td
                          className={cn(
                            'py-3.5 px-2 text-center font-medium',
                            isSelected ? 'text-[#026BFC] font-bold' : 'text-slate-400'
                          )}
                        >
                          {rowNumber}
                        </td>

                        {/* Subject Name: Icon + Name */}
                        <td className="py-3.5 px-3 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <SubjectIconBadge
                              name={s.name}
                              iconName={s.iconName}
                              className="w-8 h-8 shrink-0"
                            />
                            <span className="font-bold text-slate-900 dark:text-white block leading-snug">
                              {s.name}
                            </span>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-3.5 px-2.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap',
                              s.category === 'Social Science'
                                ? 'bg-[#E8F8F0] text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-300'
                                : s.category === 'Aptitude'
                                  ? 'bg-[#F6EEFD] text-[#8B5CF6] dark:bg-purple-950/60 dark:text-purple-300'
                                  : 'bg-[#EBF5FF] text-[#026BFC] dark:bg-blue-950/60 dark:text-blue-300'
                            )}
                          >
                            {s.category}
                          </span>
                        </td>

                        {/* Topics Count (Blue text) */}
                        <td className="py-3.5 px-2 text-center text-[#026BFC] font-semibold">
                          {s.topicsCount}
                        </td>

                        {/* Topic Tests Count (Blue text) */}
                        <td className="py-3.5 px-2 text-center text-[#026BFC] font-semibold">
                          {s.topicTestsCount}
                        </td>

                        {/* Total Questions */}
                        <td className="py-3.5 px-3 text-center text-slate-700 dark:text-slate-300 font-medium">
                          {s.totalQuestionsFormatted ||
                            s.totalQuestionsCount.toLocaleString('en-IN')}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-2.5 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-xs font-medium inline-block',
                              isPublished
                                ? 'bg-[#E8F8F0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-[#FEF8E7] text-[#D97706] dark:bg-amber-950/60 dark:text-amber-300'
                            )}
                          >
                            {s.statusLabel}
                          </span>
                        </td>

                        {/* Actions Menu */}
                        <td
                          className="py-3.5 px-2.5 text-center relative"
                          onClick={(evt) => evt.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label={`Actions for ${s.name}`}
                            onClick={() =>
                              setOpenActionMenuId(openActionMenuId === s.id ? null : s.id)
                            }
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            <MoreHorizontal className="w-4 h-4 text-slate-500" />
                          </button>

                          {openActionMenuId === s.id && (
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
                                    handleSelectSubjectRow(s);
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
                                    handleOpenEditModal(s);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                                  Edit Subject
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleDuplicateSubject(s);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-indigo-500" />
                                  Duplicate Subject
                                </button>

                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    if (
                                      confirm(
                                        `Permanently delete subject "${s.name}"? This cannot be undone.`
                                      )
                                    ) {
                                      handleDeleteSubject(s.id);
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete Subject
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

          {/* Pagination Controls matching screenshot */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of {totalItems} subjects
            </span>

            <div className="flex items-center gap-3">
              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                <button
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
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
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
