import { FileText, CheckCircle2, Clock, Eye } from 'lucide-react';
import type { AdminBlogState } from './useAdminBlog';

export interface BlogKpiCardsProps {
  blogState: AdminBlogState;
}

export function BlogKpiCards({ blogState }: BlogKpiCardsProps) {
  const { stats } = blogState;
  const total = stats.total ?? 0;
  const shareOfTotal = (n: number | undefined) =>
    total > 0 ? `${Math.round(((n ?? 0) / total) * 100)}% of total` : '—';
  return (
    <>
      {/* Top 4 KPI Cards Redesigned */}
      <div className="pk-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Posts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                Total Posts
              </span>
            </div>
          </div>
          <div className="my-auto py-3 text-center flex flex-col items-center justify-center">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {(stats.total ?? 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2">all posts</p>
          </div>
        </div>

        {/* Card 2: Published */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                Published
              </span>
            </div>
          </div>
          <div className="my-auto py-3 text-center flex flex-col items-center justify-center">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {(stats.published ?? 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2">
              {shareOfTotal(stats.published)}
            </p>
          </div>
        </div>

        {/* Card 3: Drafts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                Drafts
              </span>
            </div>
          </div>
          <div className="my-auto py-3 text-center flex flex-col items-center justify-center">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {(stats.drafts ?? 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2">
              {shareOfTotal(stats.drafts)}
            </p>
          </div>
        </div>

        {/* Card 4: Total Views */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shrink-0 shadow-2xs">
                <Eye className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                Total Views
              </span>
            </div>
          </div>
          <div className="my-auto py-3 text-center flex flex-col items-center justify-center">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {(stats.totalViews ?? 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2">
              across all posts
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
