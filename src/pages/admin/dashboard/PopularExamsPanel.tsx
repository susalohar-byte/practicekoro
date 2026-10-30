import { Link } from 'react-router-dom';
import { ExamEmblemBadge } from '@/components/common/ExamEmblemBadge';
import type { AdminDashboardState } from './useAdminDashboard';

export interface PopularExamsPanelProps {
  db: AdminDashboardState;
}

export function PopularExamsPanel({ db }: PopularExamsPanelProps) {
  const { popularExams } = db;
  return (
    <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
            Most Popular Exams
          </h3>
          <Link
            to="/admin/exams"
            className="text-xs font-bold text-[#026BFC] hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <span className="text-sm">→</span>
          </Link>
        </div>

        <div className="space-y-4 mt-4">
          {popularExams.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No exams found.</div>
          ) : (
            popularExams.map((exam, index) => (
              <div key={exam.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-3 text-center">
                    {index + 1}
                  </span>
                  <ExamEmblemBadge
                    title={exam.name}
                    slug={exam.slug}
                    iconName={exam.iconName}
                    className="w-8 h-8 rounded-lg shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {exam.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{exam.attempts}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20 sm:w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, exam.percentage))}%` }}
                      className="h-full bg-[#026BFC] rounded-full transition-all duration-300"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 w-7 text-right">
                    {exam.percentage}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
