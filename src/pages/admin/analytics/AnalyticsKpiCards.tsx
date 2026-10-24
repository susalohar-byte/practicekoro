import { Users, UserCheck, UserPlus, FileText, BookOpen, Target } from 'lucide-react';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface AnalyticsKpiCardsProps {
  analyticsState: AdminAnalyticsState;
}

export function AnalyticsKpiCards({ analyticsState }: AnalyticsKpiCardsProps) {
  const {
    card,
    totalStudentsCount,
    activeStudentsCount,
    newStudentsCount,
    testsAttemptedCount,
    questionsAnsweredCount,
    overallAccuracyVal,
  } = analyticsState;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* Card 1: Total Students */}
      <div className={card}>
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-2xs">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Total Students
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {totalStudentsCount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            +{newStudentsCount.toLocaleString('en-IN')} in selected range
          </p>
        </div>
      </div>

      {/* Card 2: Active Students */}
      <div className={card}>
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-2xs">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Active Students
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {activeStudentsCount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            {Math.round((activeStudentsCount / Math.max(1, totalStudentsCount)) * 100)}% of total
          </p>
        </div>
      </div>

      {/* Card 3: New Students */}
      <div className={card}>
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shadow-2xs">
            <UserPlus className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            New Students
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {newStudentsCount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            in selected range
          </p>
        </div>
      </div>

      {/* Card 4: Tests Attempted */}
      <div className={card}>
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shadow-2xs">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Tests Attempted
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {testsAttemptedCount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            in selected range
          </p>
        </div>
      </div>

      {/* Card 5: Questions Answered */}
      <div className={card}>
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Questions Answered
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {questionsAnsweredCount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            in selected range
          </p>
        </div>
      </div>

      {/* Card 6: Overall Accuracy */}
      <div className={card}>
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center shadow-2xs">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Overall Accuracy
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {overallAccuracyVal}%
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            correct / answered
          </p>
        </div>
      </div>
    </div>
  );
}
