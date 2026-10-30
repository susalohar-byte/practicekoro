import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  FileCheck,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';
import type { AdminTestAttemptsState } from './useAdminTestAttempts';

export interface TestAttemptsTableCardProps {
  testAttemptsState: AdminTestAttemptsState;
}

export function TestAttemptsTableCard({ testAttemptsState }: TestAttemptsTableCardProps) {
  const {
    selectedAttemptId,
    setSelectedAttemptId,
    isPanelOpen,
    setIsPanelOpen,
    selectedRowIds,
    setCurrentPage,
    pageSize,
    setPageSize,
    openActionMenuId,
    setOpenActionMenuId,
    setIsAnswerSheetModalOpen,
    setActiveModalAttempt,
    setDeleteConfirmationId,
    actionMenuRef,
    filteredAttempts,
    paginationRange,
    totalPages,
    paginatedAttempts,
    isAllCurrentPageSelected,
    toggleSelectAll,
    toggleSelectRow,
    handleReevaluate,
  } = testAttemptsState;
  return (
    <>
      {/* Table Section */}
      <div className="flex-1 w-full min-w-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-8">
                  #
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[150px]">
                  Student
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[170px]">
                  Test Name
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[90px]">
                  Type
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[70px]">
                  Score
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[80px]">
                  Accuracy
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[80px]">
                  Time Taken
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[95px]">
                  Status
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[100px]">
                  Attempted At
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center w-12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paginatedAttempts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                    No test attempts found matching the filters.
                  </td>
                </tr>
              ) : (
                paginatedAttempts.map((attempt, index) => {
                  const globalIdx = (paginationRange.currentPage - 1) * pageSize + index + 1;
                  const isSelectedRow = selectedAttemptId === attempt.id && isPanelOpen;
                  const isChecked = selectedRowIds.has(attempt.id);

                  return (
                    <tr
                      key={attempt.id}
                      onClick={() => {
                        setSelectedAttemptId(attempt.id);
                        setIsPanelOpen(true);
                      }}
                      className={cn(
                        'hover:bg-[#F8FAFC] transition-colors cursor-pointer text-xs',
                        isSelectedRow && 'bg-[#F0F7FF]/70'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelectRow(attempt.id, e)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* # */}
                      <td className="py-3 px-2 font-semibold text-[#64748B]">{globalIdx}</td>

                      {/* Student Name & ID */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {attempt.studentAvatar ? (
                            <img
                              src={attempt.studentAvatar}
                              alt={attempt.studentName}
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs',
                                attempt.studentAvatarColor || 'bg-blue-600'
                              )}
                            >
                              {attempt.studentInitials ||
                                attempt.studentName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-[#0F172A] leading-tight truncate">
                              {attempt.studentName}
                            </p>
                            <p className="text-[10px] text-[#64748B] font-mono leading-tight mt-0.5">
                              {attempt.studentId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Test Name */}
                      <td className="py-3 px-3 font-semibold text-[#1E293B] truncate max-w-[200px]">
                        {attempt.testName}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3">
                        {attempt.type === 'Full Mock' && (
                          <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block">
                            Full Mock
                          </span>
                        )}
                        {attempt.type === 'Topic Test' && (
                          <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block">
                            Topic Test
                          </span>
                        )}
                        {attempt.type === 'Official PYQ' && (
                          <span className="bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block">
                            Official PYQ
                          </span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3 px-3 font-bold text-[#1E293B]">
                        {attempt.score} / {attempt.totalMarks > 0 ? attempt.totalMarks : '—'}
                      </td>

                      {/* Accuracy */}
                      <td className="py-3 px-3">
                        {attempt.accuracy >= 70 ? (
                          <span className="bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold px-2 py-0.5 rounded-md inline-block">
                            {attempt.accuracy}%
                          </span>
                        ) : attempt.accuracy >= 50 ? (
                          <span className="bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold px-2 py-0.5 rounded-md inline-block">
                            {attempt.accuracy}%
                          </span>
                        ) : (
                          <span className="bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold px-2 py-0.5 rounded-md inline-block">
                            {attempt.accuracy}%
                          </span>
                        )}
                      </td>

                      {/* Time Taken */}
                      <td className="py-3 px-3 text-[#475569] font-medium">{attempt.timeTaken}</td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {attempt.status === 'Completed' ? (
                          <span className="bg-[#DCFCE7]/70 text-[#15803D] border border-[#86EFAC]/40 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block">
                            Completed
                          </span>
                        ) : (
                          <span className="bg-[#FEE2E2]/70 text-[#DC2626] border border-[#FCA5A5]/40 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block">
                            Not Completed
                          </span>
                        )}
                      </td>

                      {/* Attempted At (Date + Time) */}
                      <td className="py-3 px-3 leading-tight">
                        <p className="font-semibold text-[#1E293B] text-[11px]">
                          {attempt.attemptedAtDate}
                        </p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">
                          {attempt.attemptedAtTime}
                        </p>
                      </td>

                      {/* Actions menu */}
                      <td
                        className="py-3 px-3 text-center relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setOpenActionMenuId(openActionMenuId === attempt.id ? null : attempt.id)
                          }
                          className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Popover Menu */}
                        {openActionMenuId === attempt.id && (
                          <div
                            ref={actionMenuRef}
                            className="absolute right-2 top-8 z-30 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 text-left text-xs animate-in fade-in duration-150"
                          >
                            <button
                              onClick={() => {
                                setSelectedAttemptId(attempt.id);
                                setIsPanelOpen(true);
                                setOpenActionMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>View Details</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveModalAttempt(attempt);
                                setIsAnswerSheetModalOpen(true);
                                setOpenActionMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Answer Sheet</span>
                            </button>
                            <button
                              onClick={() => handleReevaluate(attempt.id)}
                              className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Re-evaluate</span>
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => setDeleteConfirmationId(attempt.id)}
                              className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Record</span>
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

        {/* Pagination Footer */}
        <div className="py-3 px-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#64748B] font-medium">
            Showing{' '}
            {filteredAttempts.length === 0
              ? '0'
              : `${paginationRange.startIndex}–${paginationRange.endIndex}`}{' '}
            of {filteredAttempts.length.toLocaleString('en-IN')} attempts
          </span>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={!paginationRange.hasPreviousPage}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers(paginationRange.currentPage, totalPages).map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 select-none">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-label={`Page ${item}`}
                  aria-current={paginationRange.currentPage === item ? 'page' : undefined}
                  disabled={filteredAttempts.length === 0}
                  onClick={() => setCurrentPage(item)}
                  className={cn(
                    'min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                    paginationRange.currentPage === item
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-[#64748B] hover:bg-slate-100'
                  )}
                >
                  {item}
                </button>
              )
            )}

            <button
              type="button"
              aria-label="Next page"
              disabled={!paginationRange.hasNextPage}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Page Size Select */}
          <div className="relative">
            <select
              aria-label="Items per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-[#E2E8F0] rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </>
  );
}
