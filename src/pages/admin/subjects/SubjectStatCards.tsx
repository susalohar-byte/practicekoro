import { Layers, FileText, Users, TrendingUp, BookOpen } from 'lucide-react';
import type { AdminSubjectsState } from './useAdminSubjects';

export interface SubjectStatCardsProps {
  sb: AdminSubjectsState;
}

export function SubjectStatCards({ sb }: SubjectStatCardsProps) {
  const { subjectsList, chapters, isLoading, loadError, summary } = sb;
  return (
    <>
      {!isLoading && !loadError && (
        <>
          {/* 2. Top 5 KPI Cards in Single Row matching screenshot */}
          <div className="pk-stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total Subjects */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
                  Total Subjects
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {isLoading || loadError ? 'Unavailable' : subjectsList.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Current database records</p>
              </div>
            </div>

            {/* Card 2: Total Topics */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#E8F8F0] dark:bg-emerald-950/50 text-[#10B981] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
                  Total Topics
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {isLoading || loadError ? 'Unavailable' : chapters.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Total Topic Tests */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FEF8E7] dark:bg-amber-950/50 text-[#F59E0B] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
                  Total Topic Tests
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {isLoading || loadError ? 'Unavailable' : summary.topicTests}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Tests Taken */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] dark:bg-purple-950/50 text-[#8B5CF6] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
                  Tests Taken
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {isLoading || loadError ? 'Unavailable' : (summary.attempts ?? 'Unavailable')}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 5: Avg. Accuracy */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
              <div className="w-11 h-11 rounded-2xl bg-[#FEECEC] dark:bg-rose-950/50 text-[#EF4444] flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
                  Avg. Accuracy
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {isLoading || loadError ? 'Unavailable' : summary.accuracy}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {!isLoading && !loadError && (
        <p className="text-xs text-slate-500">
          All-time recorded counts. Average accuracy uses correct / (correct + wrong) answers in
          completed subject-linked tests; average score uses recorded score percentages. Unavailable
          values are not estimated.
        </p>
      )}
    </>
  );
}
