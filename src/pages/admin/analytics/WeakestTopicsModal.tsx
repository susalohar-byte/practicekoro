import { X, ExternalLink } from 'lucide-react';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface WeakestTopicsModalProps {
  analyticsState: AdminAnalyticsState;
}

export function WeakestTopicsModal({ analyticsState }: WeakestTopicsModalProps) {
  const { setViewAllModal, displayWeakestTopics, setSelectedTopicId } = analyticsState;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/45 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              All Weakest Chapters &amp; Topics
            </h3>
            <p className="text-[11px] text-slate-500">
              Low-scoring topics requiring revision practice packs.
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
                <th className="py-2 font-medium">Topic Name</th>
                <th className="py-2 font-medium">Subject</th>
                <th className="py-2 font-medium text-center">Accuracy</th>
                <th className="py-2 font-medium text-center">Questions Attempted</th>
                <th className="py-2 font-medium text-right">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayWeakestTopics.map((top) => (
                <tr key={top.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                  <td className="py-2.5 text-slate-400 font-semibold">{top.rank}</td>
                  <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">
                    {top.name}
                  </td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400">{top.subjectName}</td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        top.accuracy < 40
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                          : top.accuracy < 50
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {top.accuracy}%
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                    {top.answers.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(top.id);
                        setViewAllModal(null);
                      }}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    >
                      Select Topic
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <a
            href="/admin/topics"
            className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
          >
            Manage Topics in Catalog <ExternalLink className="w-3 h-3" />
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
