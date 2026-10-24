import { X, ExternalLink } from 'lucide-react';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface WeakestSubjectsModalProps {
  analyticsState: AdminAnalyticsState;
}

export function WeakestSubjectsModal({ analyticsState }: WeakestSubjectsModalProps) {
  const { setViewAllModal, displayWeakestSubjects, setSelectedWeakSubject } = analyticsState;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/45 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              All Weakest Subjects
            </h3>
            <p className="text-[11px] text-slate-500">
              Overview of student accuracy across all tested subjects.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setViewAllModal(null)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2 font-medium w-8">#</th>
                <th className="py-2 font-medium">Subject</th>
                <th className="py-2 font-medium text-center">Accuracy</th>
                <th className="py-2 font-medium text-center">Questions Attempted</th>
                <th className="py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayWeakestSubjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                  <td className="py-2.5 text-slate-400 font-semibold">{sub.rank}</td>
                  <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">
                    {sub.name}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        sub.accuracy < 50
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                          : sub.accuracy < 60
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {sub.accuracy}%
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                    {sub.answers.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setViewAllModal(null);
                        setSelectedWeakSubject({
                          id: sub.id,
                          name: sub.name,
                          accuracy: sub.accuracy,
                          answers: sub.answers,
                        });
                      }}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <a
            href="/admin/subjects"
            className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
          >
            Manage Subjects in Catalog <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={() => setViewAllModal(null)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
