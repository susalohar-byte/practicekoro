import { ArrowUpRight } from 'lucide-react';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface SubjectAnswersCardProps {
  analyticsState: AdminAnalyticsState;
}

export function SubjectAnswersCard({ analyticsState }: SubjectAnswersCardProps) {
  const { card, displayWeakestSubjects, setSelectedWeakSubject } = analyticsState;
  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Subject-wise Answers</h2>
        <a
          href="/admin/students"
          className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5"
        >
          View All <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th className="py-2 font-medium w-6">#</th>
              <th className="py-2 font-medium">Subject</th>
              <th className="py-2 font-medium text-center">Answers</th>
              <th className="py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayWeakestSubjects.slice(0, 5).map((sub) => (
              <tr key={sub.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                <td className="py-2.5 text-slate-400 font-semibold">{sub.rank}</td>
                <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">{sub.name}</td>
                <td className="py-2.5 text-center font-bold text-slate-700 dark:text-slate-200">
                  {sub.answers.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWeakSubject({
                        id: sub.id,
                        name: sub.name,
                        accuracy: sub.accuracy,
                        answers: sub.answers,
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 transition-colors cursor-pointer"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
