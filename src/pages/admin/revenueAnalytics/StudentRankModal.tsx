import { Trophy, Download, X, Search, Award, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRevenueAnalyticsState } from './useAdminRevenueAnalytics';

export interface StudentRankModalProps {
  ra: AdminRevenueAnalyticsState;
}

export function StudentRankModal({ ra }: StudentRankModalProps) {
  const {
    filteredRankings,
    handleExportRankingsCsv,
    setIsRankModalOpen,
    rankSearchQuery,
    setRankSearchQuery,
    rankCurrentPage,
    totalRankPages,
    paginatedRankings,
    setRankCurrentPage,
    pageSize,
  } = ra;
  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-3 sm:p-5">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Student Leaderboard & Rankings</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {filteredRankings.length} Students
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Platform ranking calculated from test attempts, accuracy percentage, and total
                scores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportRankingsCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Export Rankings CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setIsRankModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Search Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student by name, email, or rank..."
              value={rankSearchQuery}
              onChange={(e) => setRankSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            {rankSearchQuery && (
              <button
                onClick={() => setRankSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Clear
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">
            Page {rankCurrentPage} of {totalRankPages}
          </div>
        </div>

        {/* Modal Rankings Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-center">Total Tests</th>
                <th className="px-4 py-3 text-center">Questions Solved</th>
                <th className="px-4 py-3 text-center">Accuracy</th>
                <th className="px-4 py-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRankings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                    No students found matching "{rankSearchQuery}".
                  </td>
                </tr>
              ) : (
                paginatedRankings.map((student) => {
                  const isTop1 = student.rank === 1;
                  const isTop2 = student.rank === 2;
                  const isTop3 = student.rank === 3;

                  return (
                    <tr
                      key={student.userId}
                      className={cn(
                        'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors',
                        isTop1 && 'bg-amber-500/5',
                        isTop2 && 'bg-slate-400/5',
                        isTop3 && 'bg-orange-500/5'
                      )}
                    >
                      {/* Rank */}
                      <td className="px-4 py-3">
                        {isTop1 ? (
                          <span className="inline-flex items-center gap-1 font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                            <Award className="w-3.5 h-3.5 text-amber-500" /> #1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center gap-1 font-black text-slate-500 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-lg">
                            <Award className="w-3.5 h-3.5 text-slate-400" /> #2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center gap-1 font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg">
                            <Award className="w-3.5 h-3.5 text-orange-500" /> #3
                          </span>
                        ) : (
                          <span className="font-bold text-slate-500 dark:text-slate-400 px-1">
                            #{student.rank}
                          </span>
                        )}
                      </td>

                      {/* Student Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{student.name}</span>
                              {student.isPro && (
                                <span
                                  className="p-0.5 rounded bg-amber-400 text-white shadow-xs"
                                  title="Pro Subscriber"
                                >
                                  <Crown className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                        {student.email}
                      </td>

                      {/* Total Tests */}
                      <td className="px-4 py-3 text-center font-semibold text-slate-800 dark:text-slate-200">
                        {student.totalTests}
                      </td>

                      {/* Questions Solved */}
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                        {student.questionsAttempted}
                      </td>

                      {/* Accuracy */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md font-extrabold text-[11px]',
                            student.accuracy >= 70
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : student.accuracy >= 45
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          )}
                        >
                          {student.accuracy}%
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          {student.totalScore}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Pagination Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredRankings.length === 0 ? 0 : (rankCurrentPage - 1) * pageSize + 1} to{' '}
            {Math.min(filteredRankings.length, rankCurrentPage * pageSize)} of{' '}
            {filteredRankings.length} aspirants
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRankCurrentPage((p) => Math.max(1, p - 1))}
              disabled={rankCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
              {rankCurrentPage} / {totalRankPages}
            </span>
            <button
              onClick={() => setRankCurrentPage((p) => Math.min(totalRankPages, p + 1))}
              disabled={rankCurrentPage === totalRankPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
