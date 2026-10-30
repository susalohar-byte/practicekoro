import {
  GraduationCap,
  ArrowUpRight,
  Users,
  UserCheck,
  CheckSquare2,
  HelpCircle,
  Target,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import type { AdminRevenueAnalyticsState } from './useAdminRevenueAnalytics';

export interface StudentPerformanceSectionProps {
  ra: AdminRevenueAnalyticsState;
}

export function StudentPerformanceSection({ ra }: StudentPerformanceSectionProps) {
  const { setIsRankModalOpen, isLoading, analyticsData } = ra;
  return (
    <>
      {/* ─── SECTION 1: STUDENT PERFORMANCE ─────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Student Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aspirant engagement, tests completed, overall accuracy and rankings
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRankModalOpen(true)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Rankings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <div className="pk-stagger grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* 1. Total Students */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Students
              </span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : !analyticsData
                  ? '—'
                  : (analyticsData?.studentPerformance.totalStudents ?? 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Registered Aspirants</p>
          </div>

          {/* 2. Active Students */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Students
              </span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {isLoading
                ? '...'
                : !analyticsData
                  ? '—'
                  : (analyticsData?.studentPerformance.activeStudents ?? 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Attempted Tests</p>
          </div>

          {/* 3. Tests Attempted */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tests Attempted
              </span>
              <CheckSquare2 className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : !analyticsData
                  ? '—'
                  : (analyticsData?.studentPerformance.testsAttempted ?? 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Full & Sectional Mocks</p>
          </div>

          {/* 4. Questions Answered */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Questions Solved
              </span>
              <HelpCircle className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : !analyticsData
                  ? '—'
                  : (analyticsData?.studentPerformance.questionsAnswered ?? 0).toLocaleString(
                      'en-IN'
                    )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total Question Responses</p>
          </div>

          {/* 5. Overall Accuracy */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Overall Accuracy
              </span>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
              <span>
                {isLoading
                  ? '...'
                  : !analyticsData
                    ? '—'
                    : `${analyticsData.studentPerformance.overallAccuracy}%`}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Platform Average</p>
          </div>

          {/* 6. Clickable Rank Metric Card */}
          <div
            onClick={() => setIsRankModalOpen(true)}
            className="group cursor-pointer rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 hover:border-amber-500 transition-all hover:shadow-md hover:shadow-amber-500/10 active:scale-[0.98] relative overflow-hidden"
            title="Click to view complete student rankings list"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Rank & Leaderboard
              </span>
              <ArrowUpRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white truncate">
              {isLoading
                ? '...'
                : !analyticsData
                  ? '—'
                  : analyticsData?.studentPerformance.topStudent
                    ? `#1 ${analyticsData.studentPerformance.topStudent.name.split(' ')[0]}`
                    : 'Top Ranks'}
            </div>
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <span>Click to view all ranks ({analyticsData?.studentRankings.length || 0})</span>
            </p>
          </div>
        </div>

        {/* Performance Trend Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              Performance Trend (Daily Tests & Accuracy)
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Last 7 Active Days</span>
          </div>

          {/* Simple Clean Bar/Timeline Visualizer */}
          <div className="grid grid-cols-7 gap-2 pt-2">
            {analyticsData?.studentPerformance.performanceTrend.map((pt, idx) => {
              const maxTests = Math.max(
                10,
                ...(analyticsData?.studentPerformance.performanceTrend.map(
                  (p) => p.attemptsCount
                ) || [10])
              );
              const heightPct = Math.min(
                100,
                Math.max(15, Math.round((pt.attemptsCount / maxTests) * 100))
              );

              return (
                <div key={idx} className="flex flex-col items-center gap-2 text-center group">
                  <div className="h-28 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl p-1.5 flex flex-col justify-end items-center relative border border-slate-100 dark:border-slate-800/60">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-9 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                      {pt.attemptsCount} tests • {pt.averageAccuracy}% acc
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-lg transition-all group-hover:brightness-110"
                    />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate w-full">
                    {pt.label}
                  </div>
                  <div className="text-[10px] font-bold text-slate-900 dark:text-white -mt-1">
                    {pt.attemptsCount} tests
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
