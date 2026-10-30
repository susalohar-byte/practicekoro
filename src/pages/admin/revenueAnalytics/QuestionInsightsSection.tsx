import { HelpCircle, AlertCircle, Layers, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRevenueAnalyticsState } from './useAdminRevenueAnalytics';

export interface QuestionInsightsSectionProps {
  ra: AdminRevenueAnalyticsState;
}

export function QuestionInsightsSection({ ra }: QuestionInsightsSectionProps) {
  const { analyticsData } = ra;
  return (
    <>
      {/* ─── SECTION 2: QUESTION & TOPIC INSIGHTS ─────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Question & Topic Insights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identify failure-prone questions, weakest syllabus topics, and low-accuracy subjects
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Most Wrong Questions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Most Wrong Questions
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50">
                  Highest Failure %
                </span>
              </div>

              <div className="space-y-3">
                {analyticsData?.questionInsights.mostWrongQuestions.map((q, idx) => (
                  <div
                    key={q.questionId || idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {q.questionBengaliText || q.questionText}
                      </p>
                      <span className="shrink-0 text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-md">
                        {q.failureRate}% Fail
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {q.subjectName}
                      </span>
                      <span>•</span>
                      <span className="truncate">{q.chapterName}</span>
                      <span>•</span>
                      <span>{q.totalAttempts} attempts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Weakest Topics */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weakest Topics
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                  Needs Focus
                </span>
              </div>

              <div className="space-y-3.5">
                {analyticsData?.questionInsights.weakestTopics.map((t, idx) => (
                  <div key={t.chapterId || idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {t.chapterName}
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {t.accuracyRate}% Acc
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(5, t.accuracyRate))}%` }}
                        className={cn(
                          'h-full rounded-full',
                          t.accuracyRate < 45 ? 'bg-rose-500' : 'bg-amber-500'
                        )}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="truncate">{t.subjectName}</span>
                      <span>{t.totalQuestionsAttempted} questions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Weakest Subjects */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weakest Subjects
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-900/50">
                  Subject Benchmark
                </span>
              </div>

              <div className="space-y-3.5">
                {analyticsData?.questionInsights.weakestSubjects.map((s, idx) => (
                  <div key={s.subjectId || idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {s.subjectName}
                      </span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {s.accuracyRate}% Acc
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(5, s.accuracyRate))}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Overall attempts</span>
                      <span>{s.totalQuestionsAttempted} answered</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
