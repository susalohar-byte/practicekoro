import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminDashboardState } from './useAdminDashboard';

export interface MostAttemptedTestsPanelProps {
  db: AdminDashboardState;
}

export function MostAttemptedTestsPanel({ db }: MostAttemptedTestsPanelProps) {
  const { mostAttemptedTests } = db;
  return (
    <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
            Most Attempted Tests
          </h3>
          <Link
            to="/admin/mock-tests"
            className="text-xs font-bold text-[#026BFC] hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <span className="text-sm">→</span>
          </Link>
        </div>

        <div className="space-y-3.5 mt-4">
          {mostAttemptedTests.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No attempted tests yet.</div>
          ) : (
            mostAttemptedTests.map((test, index) => (
              <div key={test.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-3 text-center">
                    {index + 1}
                  </span>
                  {test.iconUrl ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
                      <img
                        src={test.iconUrl}
                        alt={test.title}
                        className="w-full h-full object-contain rounded-md"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        test.iconBg
                      )}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {test.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{test.exam}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {test.attempts}
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
