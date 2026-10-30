import { Link } from 'react-router-dom';
import type { AdminDashboardState } from './useAdminDashboard';

export interface TopStudentsPanelProps {
  db: AdminDashboardState;
}

export function TopStudentsPanel({ db }: TopStudentsPanelProps) {
  const { topStudents } = db;
  return (
    <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
            Top Performing Students
          </h3>
          <Link
            to="/admin/rankings"
            className="text-xs font-bold text-[#026BFC] hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <span className="text-sm">→</span>
          </Link>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                <th className="font-medium pb-2 w-7">#</th>
                <th className="font-medium pb-2">Name</th>
                <th className="font-medium pb-2">Location</th>
                <th className="font-medium pb-2 text-center">Avg. Score</th>
                <th className="font-medium pb-2 text-right">Tests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {topStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No student performance records yet.
                  </td>
                </tr>
              ) : (
                topStudents.map((st) => (
                  <tr key={st.rank} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5">
                      {st.badge === 'gold' && (
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 font-bold flex items-center justify-center text-[10px]">
                          1
                        </span>
                      )}
                      {st.badge === 'silver' && (
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold flex items-center justify-center text-[10px]">
                          2
                        </span>
                      )}
                      {st.badge === 'bronze' && (
                        <span className="w-5 h-5 rounded-full bg-amber-200/70 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 font-bold flex items-center justify-center text-[10px]">
                          3
                        </span>
                      )}
                      {st.badge === 'regular' && (
                        <span className="text-slate-400 font-semibold text-center block w-5">
                          {st.rank}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{st.name}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{st.location}</td>
                    <td className="py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {st.score}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {st.tests}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
