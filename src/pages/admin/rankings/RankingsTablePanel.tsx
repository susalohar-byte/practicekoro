import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Radio,
  Trophy,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRankingsState } from './useAdminRankings';
import { StudentAvatar } from '@/pages/admin/students/StudentAvatar';

export interface RankingsTablePanelProps {
  rk: AdminRankingsState;
}

export function RankingsTablePanel({ rk }: RankingsTablePanelProps) {
  const {
    navigate,
    scopeTab,
    selectedTestType,
    loadError,
    selectedStudentRank,
    setSelectedStudentRank,
    setIsDetailsOpen,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    openActionRank,
    setOpenActionRank,
    actionMenuRef,
    setIsProfileModalOpen,
    filteredStudents,
    totalPages,
    paginatedStudents,
    getPageNumbers,
  } = rk;
  return (
    <>
      {/* ==================== LEFT: RANKINGS TABLE ==================== */}
      <div className="flex-1 w-full min-w-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center">
                  #
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[170px]">
                  Student
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[90px]">
                  Tests Attempted
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[100px]">
                  Questions Answered
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[80px]">
                  Accuracy
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[80px]">
                  Avg. Score
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[95px]">
                  Last Active
                </th>
                <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center w-12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {loadError
                      ? 'Rankings could not be loaded.'
                      : scopeTab === 'Live Tests' || selectedTestType === 'Live Test'
                        ? 'No student attempts have been submitted for Live Tests yet.'
                        : 'No completed attempts match these filters.'}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const isSelected = selectedStudentRank === student.rank;

                  return (
                    <tr
                      key={student.rank}
                      onClick={() => {
                        setSelectedStudentRank(student.rank);
                        setIsDetailsOpen(true);
                      }}
                      className={cn(
                        'hover:bg-[#F8FAFC] transition-colors cursor-pointer text-xs',
                        isSelected && 'bg-[#EFF6FF]'
                      )}
                    >
                      {/* Rank Medal / Badge */}
                      <td className="py-3 px-3.5 text-center">
                        {student.rank === 1 && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-amber-300">
                            1
                          </div>
                        )}
                        {student.rank === 2 && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-400 to-slate-300 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-slate-200">
                            2
                          </div>
                        )}
                        {student.rank === 3 && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-700 to-orange-500 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-orange-300">
                            3
                          </div>
                        )}
                        {student.rank > 3 && (
                          <span className="font-bold text-[#64748B]">{student.rank}</span>
                        )}
                      </td>

                      {/* Student Details (Avatar + Name + Location + Optional Live Badge) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {student.avatar ? (
                            <StudentAvatar
                              avatarUrl={student.avatar}
                              fullName={student.name}
                              initials={student.initials}
                              className="w-8 h-8 rounded-full shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs',
                                student.initialsBg || 'bg-blue-600 text-white'
                              )}
                            >
                              {student.initials || student.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-[#0F172A] leading-tight truncate">
                                {student.name}
                              </p>
                              {(scopeTab === 'Live Tests' || selectedTestType === 'Live Test') && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                                  <Radio className="w-2.5 h-2.5 animate-pulse text-rose-500" />
                                  Live
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#64748B] leading-tight mt-0.5 truncate">
                              {student.location}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tests Attempted */}
                      <td className="py-3 px-3 text-center font-semibold text-[#1E293B]">
                        {student.testsAttempted}
                      </td>

                      {/* Questions Answered */}
                      <td className="py-3 px-3 text-center font-semibold text-[#1E293B]">
                        {student.questionsAnswered.toLocaleString()}
                      </td>

                      {/* Accuracy */}
                      <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                        {student.accuracy}%
                      </td>

                      {/* Avg. Score */}
                      <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                        {student.avgScore}%
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-3 text-[#475569] font-medium text-[11px]">
                        {student.lastActive}
                      </td>

                      {/* Actions Menu */}
                      <td
                        className="py-3 px-3 text-center relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setOpenActionRank(openActionRank === student.rank ? null : student.rank)
                          }
                          className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Popover Menu */}
                        {openActionRank === student.rank && (
                          <div
                            ref={actionMenuRef}
                            className="absolute right-2 top-8 z-30 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 text-left text-xs animate-in fade-in duration-150"
                          >
                            <button
                              onClick={() => {
                                setSelectedStudentRank(student.rank);
                                setIsDetailsOpen(true);
                                setOpenActionRank(null);
                              }}
                              className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <Trophy className="w-3.5 h-3.5 text-amber-500" />
                              <span>View Ranking</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsProfileModalOpen(true);
                                setOpenActionRank(null);
                              }}
                              className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>View Profile</span>
                            </button>
                            <button
                              onClick={() => {
                                navigate('/admin/students');
                                setOpenActionRank(null);
                              }}
                              className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <Users className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Manage Student</span>
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
            {filteredStudents.length === 0
              ? '0'
              : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredStudents.length)}`}{' '}
            of {filteredStudents.length.toLocaleString('en-IN')} students
          </span>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((p, idx) =>
              typeof p === 'number' ? (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                    currentPage === p
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-[#64748B] hover:bg-slate-100'
                  )}
                >
                  {p}
                </button>
              ) : (
                <span key={idx} className="px-1 text-slate-400 text-xs">
                  ...
                </span>
              )
            )}

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Page Size Select */}
          <div className="relative">
            <select
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
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </>
  );
}
