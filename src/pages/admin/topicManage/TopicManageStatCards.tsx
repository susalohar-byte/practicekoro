import { BookOpen, FolderTree, HelpCircle, CheckCircle2 } from 'lucide-react';
import { cardCls } from './topicManageUtils';
import type { AdminTopicManageState } from './useAdminTopicManage';

export interface TopicManageStatCardsProps {
  tm: AdminTopicManageState;
}

export function TopicManageStatCards({ tm }: TopicManageStatCardsProps) {
  const { stats } = tm;
  return (
    <>
      {/* ── Stats Cards ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Subjects */}
        <div className={`${cardCls} p-4 flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Subjects
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">
              {stats.totalSubjects}
            </p>
          </div>
        </div>

        {/* Topics */}
        <div className={`${cardCls} p-4 flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
            <FolderTree className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Topics
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">
              {stats.totalTopics}
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className={`${cardCls} p-4 flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Questions
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">
              {stats.totalQuestions}
            </p>
          </div>
        </div>

        {/* Active Topics */}
        <div className={`${cardCls} p-4 flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Active Topics
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">
              {stats.activeTopics}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
