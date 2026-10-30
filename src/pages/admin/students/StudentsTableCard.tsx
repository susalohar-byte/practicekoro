import { cn } from '@/lib/utils';
import { AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import { StudentAvatar } from './StudentAvatar';
import {
  MoreHorizontal,
  Users,
  Edit2,
  Send,
  RotateCcw,
  KeyRound,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { AdminStudentsState } from './useAdminStudents';

export interface StudentsTableCardProps {
  studentsState: AdminStudentsState;
}

export function StudentsTableCard({ studentsState }: StudentsTableCardProps) {
  const {
    isPanelOpen,
    visibleStudents,
    selectedRowIds,
    handleSelectAllVisible,
    isLoading,
    selectedStudentId,
    setSelectedStudentId,
    setIsPanelOpen,
    handleToggleRow,
    setActiveMenuId,
    activeMenuId,
    setIsEditModalOpen,
    setIsNotificationModalOpen,
    handleToggleStatus,
    isWorking,
    setIsResetPasswordModalOpen,
    setIsDeleteModalOpen,
    currentFilteredCount,
    startIndex,
    itemsPerPage,
    totalStudentsCount,
    setCurrentPage,
    currentPage,
    totalPages,
    setItemsPerPage,
  } = studentsState;
  return (
    <>
      {/* LEFT: STUDENTS TABLE CARD                                       */}
      {/* =============================================================== */}
      <div
        className={cn(
          'bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all duration-300',
          isPanelOpen ? 'flex-1 min-w-0' : 'w-full'
        )}
      >
        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    aria-label="Select all rows"
                    type="checkbox"
                    checked={
                      visibleStudents.length > 0 &&
                      visibleStudents.every((s) => selectedRowIds.includes(s.id))
                    }
                    onChange={handleSelectAllVisible}
                    className="rounded border-slate-300 text-[#026BFC] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 w-8 text-slate-500 font-semibold">#</th>
                <th className="py-3 px-3 min-w-[150px]">Student</th>
                <th className="py-3 px-3 min-w-[170px]">Phone / Email</th>
                <th className="py-3 px-2 w-28">Subscription</th>
                <th className="py-3 px-2 w-24 text-center">Tests Attempted</th>
                <th className="py-3 px-2 w-20 text-center">Avg. Score</th>
                <th className="py-3 px-3 w-24">Last Active</th>
                <th className="py-3 px-2 w-20">Status</th>
                <th className="py-3 px-3 w-10 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-4">
                    <AdminSectionSkeleton label="Loading students..." variant="table" />
                  </td>
                </tr>
              ) : visibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No students match the selected criteria.
                  </td>
                </tr>
              ) : (
                visibleStudents.map((student) => {
                  const isSelected = student.id === selectedStudentId;
                  const isChecked = selectedRowIds.includes(student.id);

                  // Subscription Badge color
                  let subBadgeColor = 'bg-[#ECFDF5] text-[#059669]'; // 6 Months (green)
                  if (student.subscriptionPlan === '1 Month') {
                    subBadgeColor = 'bg-[#EBF3FE] text-[#026BFC]'; // 1 Month (blue)
                  } else if (student.subscriptionPlan === '1 Year') {
                    subBadgeColor = 'bg-[#FFFBEB] text-[#D97706]'; // 1 Year (amber)
                  } else if (student.subscriptionPlan === 'Free') {
                    subBadgeColor = 'bg-slate-100 text-slate-600'; // Free (slate)
                  }

                  return (
                    <tr
                      key={student.id}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        if (!isPanelOpen) setIsPanelOpen(true);
                      }}
                      className={cn(
                        'group cursor-pointer transition-colors duration-150 relative',
                        isSelected
                          ? 'bg-[#F4F8FF] border-l-4 border-l-[#026BFC]'
                          : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                      )}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => handleToggleRow(student.id, e)}
                      >
                        <input
                          aria-label="Select row"
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-[#026BFC] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="py-3 px-2 text-slate-600 font-medium">{student.order}</td>

                      {/* Student Avatar + Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <StudentAvatar
                            avatarUrl={student.avatarUrl}
                            fullName={student.fullName}
                            initials={student.initials}
                            initialsBg={student.initialsBg}
                            initialsColor={student.initialsColor}
                            className="w-7 h-7"
                            textClassName="text-[10px]"
                          />
                          <span className="font-semibold text-slate-900 group-hover:text-[#026BFC] transition-colors leading-snug whitespace-nowrap">
                            {student.fullName}
                          </span>
                        </div>
                      </td>

                      {/* Phone / Email (Stacked) */}
                      <td className="py-3 px-3">
                        <div className="text-[11px] text-slate-700 font-medium leading-tight">
                          {student.phone}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate max-w-[170px]">
                          {student.email}
                        </div>
                      </td>

                      {/* Subscription Badge */}
                      <td className="py-3 px-2">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded text-[11px] font-medium leading-tight whitespace-nowrap',
                            subBadgeColor
                          )}
                        >
                          {student.subscriptionPlan}
                        </span>
                      </td>

                      {/* Tests Attempted */}
                      <td className="py-3 px-2 text-center font-medium text-slate-700">
                        {student.testsAttempted}
                      </td>

                      {/* Avg. Score */}
                      <td className="py-3 px-2 text-center font-medium text-slate-700">
                        {student.avgScore != null ? `${student.avgScore}%` : 'Unavailable'}
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-3 text-slate-600 text-[11px]">{student.lastActive}</td>

                      {/* Status Badge */}
                      <td className="py-3 px-2">
                        {student.status === 'Active' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E6F8EE] text-[#15803D]">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEE2E2] text-[#DC2626]">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions (•••) */}
                      <td
                        className="py-3 px-3 text-right relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === student.id ? null : student.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Action Menu */}
                        {activeMenuId === student.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-3 top-8 z-30 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs text-left animate-in fade-in zoom-in-95"
                          >
                            <button
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setIsPanelOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                              <Users className="w-3.5 h-3.5 text-blue-500" />
                              <span>View Details</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setIsEditModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit Student</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setIsNotificationModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                              <Send className="w-3.5 h-3.5 text-blue-500" />
                              <span>Send Notification</span>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(student)}
                              disabled={isWorking || student.status === 'Unavailable'}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                              <span>
                                Mark as {student.status === 'Active' ? 'Inactive' : 'Active'}
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setIsResetPasswordModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                              <span>Reset Password</span>
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setIsDeleteModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete Student</span>
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

        {/* Table Pagination Footer */}
        <div className="py-3 px-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {currentFilteredCount === 0 ? 0 : startIndex + 1}–
              {Math.min(startIndex + itemsPerPage, currentFilteredCount)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700">
              {totalStudentsCount.toLocaleString()}
            </span>{' '}
            students
          </div>

          <div className="flex items-center gap-1.5">
            {/* Previous Button */}
            <button
              aria-label="Previous page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                    currentPage === pNum
                      ? 'bg-[#026BFC] text-white shadow-2xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {pNum}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="text-slate-400 px-0.5">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                    currentPage === totalPages
                      ? 'bg-[#026BFC] text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next Button */}
            <button
              aria-label="Next page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Page Size Select */}
            <select
              aria-label="Rows per page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="ml-2 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
