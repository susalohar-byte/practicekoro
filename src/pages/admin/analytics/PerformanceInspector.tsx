import { Search, Award, AlertTriangle, ExternalLink } from 'lucide-react';
import { getKolkataDateString } from '@/services/domains/admin.dashboard';
import type { PlatformAnalyticsData } from '@/types';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface PerformanceInspectorProps {
  analyticsState: AdminAnalyticsState;
  data: PlatformAnalyticsData;
}

export function PerformanceInspector({ analyticsState, data }: PerformanceInspectorProps) {
  const {
    card,
    deepDiveTab,
    setDeepDiveTab,
    rankingsSearch,
    setRankingsSearch,
    filteredStudentRankings,
    wrongQuestionsSearch,
    setWrongQuestionsSearch,
    filteredWrongQuestions,
  } = analyticsState;
  return (
    <section className={card}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Detailed Performance Inspector
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Deep dive into student leaderboard standings and the hardest questions across mock
            series.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDeepDiveTab('rankings')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                deepDiveTab === 'rankings'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Student Rankings</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {data.studentRankings?.length || 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDeepDiveTab('wrongQuestions')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                deepDiveTab === 'wrongQuestions'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Most Wrong Questions</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {data.questionInsights?.mostWrongQuestions?.length || 0}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Student Leaderboard / Rankings */}
      {deepDiveTab === 'rankings' && (
        <div className="pt-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name or email..."
                value={rankingsSearch}
                onChange={(e) => setRankingsSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
              />
            </div>
            <span className="text-[11px] text-slate-400">
              Showing {filteredStudentRankings.length} aspirants
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 px-3 font-semibold w-12 text-center">Rank</th>
                  <th className="py-2.5 px-3 font-semibold">Student Name</th>
                  <th className="py-2.5 px-3 font-semibold">Plan</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Tests Taken</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Accuracy</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Total Score</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudentRankings.length > 0 ? (
                  filteredStudentRankings.slice(0, 15).map((student) => (
                    <tr
                      key={student.userId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                        {student.rank <= 3 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px]">
                            #{student.rank}
                          </span>
                        ) : (
                          `#${student.rank}`
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        <div>{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {student.email}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {student.isPro ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            PRO
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800">
                            FREE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                        {student.totalTests}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            student.accuracy < 50
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
                              : student.accuracy < 70
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {student.accuracy}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                        {student.totalScore}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[11px] text-slate-400">
                        {student.lastActive
                          ? getKolkataDateString(new Date(student.lastActive))
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No student rankings recorded for this reporting period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Most Wrong Questions */}
      {deepDiveTab === 'wrongQuestions' && (
        <div className="pt-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search question keyword, subject or topic..."
                value={wrongQuestionsSearch}
                onChange={(e) => setWrongQuestionsSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                Showing {filteredWrongQuestions.length} challenging questions
              </span>
              <a
                href="/admin/item-analysis"
                className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Full item analysis <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 px-3 font-semibold w-10 text-center">#</th>
                  <th className="py-2.5 px-3 font-semibold">Question Content</th>
                  <th className="py-2.5 px-3 font-semibold">Subject / Topic</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Difficulty</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Failure Rate</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Accuracy</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredWrongQuestions.length > 0 ? (
                  filteredWrongQuestions.slice(0, 15).map((q, idx) => (
                    <tr
                      key={q.questionId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs sm:max-w-md">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                          {q.questionBengaliText || q.questionText}
                        </p>
                        {q.questionBengaliText && q.questionText && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {q.questionText}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold">{q.subjectName}</span>
                        <div className="text-[10px] text-slate-400">{q.chapterName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          {q.difficulty || 'medium'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                        {q.failureRate}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {q.accuracyRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                        {q.totalAttempts.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No difficult question data recorded for this reporting period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
