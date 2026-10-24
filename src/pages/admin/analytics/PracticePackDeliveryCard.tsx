import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { PlatformAnalyticsData } from '@/types';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface PracticePackDeliveryCardProps {
  analyticsState: AdminAnalyticsState;
  data: PlatformAnalyticsData;
}

export function PracticePackDeliveryCard({ analyticsState, data }: PracticePackDeliveryCardProps) {
  const {
    card,
    selectedTopicId,
    setSelectedTopicId,
    targetAudience,
    setTargetAudience,
    dispatchNotice,
    isDispatching,
    handleDispatchPracticePack,
  } = analyticsState;
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Topic Practice Pack Delivery
          </h2>
          <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-semibold border border-blue-100 dark:border-blue-900">
            Targeting &amp; Delivery Workflow
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Dispatch personalized revision sets
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Send an in-app practice recommendation for a weak topic to active test takers, Pro members
        or all students.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Target Weak Topic
          </label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full border rounded-xl p-2.5 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
          >
            <option value="">Select a topic to target...</option>
            {(data.questionInsights?.weakestTopics || []).map((t) => (
              <option key={t.chapterId} value={t.chapterId}>
                {t.chapterName} ({t.accuracyRate}% accuracy)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Target Student Cohort
          </label>
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value as 'all' | 'active' | 'pro')}
            className="w-full border rounded-xl p-2.5 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
          >
            <option value="active">Active Test Takers (selected range)</option>
            <option value="all">All Enrolled Students</option>
            <option value="pro">Pro Members Only</option>
          </select>
        </div>
      </div>

      {dispatchNotice && (
        <div
          role={dispatchNotice.kind === 'error' ? 'alert' : 'status'}
          className={
            dispatchNotice.kind === 'error'
              ? 'mb-3 p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200 text-xs font-medium border border-rose-200 dark:border-rose-800 flex items-center gap-2'
              : 'mb-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-2'
          }
        >
          {dispatchNotice.kind === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span>{dispatchNotice.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] text-slate-400">
          {selectedTopicId
            ? 'Topic selected. Ready to dispatch.'
            : 'Select a topic to enable delivery.'}
        </span>
        <button
          type="button"
          disabled={!selectedTopicId || isDispatching}
          onClick={handleDispatchPracticePack}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          {isDispatching ? 'Dispatching...' : 'Dispatch Topic Practice Pack'}
        </button>
      </div>
    </section>
  );
}
