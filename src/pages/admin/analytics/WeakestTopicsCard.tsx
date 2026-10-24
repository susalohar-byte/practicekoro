import { ArrowUpRight } from 'lucide-react';
import { Sparkline } from './Sparkline';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface WeakestTopicsCardProps {
  analyticsState: AdminAnalyticsState;
}

export function WeakestTopicsCard({ analyticsState }: WeakestTopicsCardProps) {
  const { card, setViewAllModal, displayWeakestTopics } = analyticsState;
  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Weakest Topics</h2>
        <button
          type="button"
          onClick={() => setViewAllModal('topics')}
          className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
        >
          View All <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th className="py-2 font-medium w-6">#</th>
              <th className="py-2 font-medium">Topic</th>
              <th className="py-2 font-medium text-center">Accuracy</th>
              <th className="py-2 font-medium text-center">Answers</th>
              <th className="py-2 font-medium text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayWeakestTopics.slice(0, 5).map((top) => (
              <tr key={top.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                <td className="py-2.5 text-slate-400 font-semibold">{top.rank}</td>
                <td
                  className="py-2.5 font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px]"
                  title={top.name}
                >
                  {top.name}
                </td>
                <td className="py-2.5 text-center">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      top.accuracy < 40
                        ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
                        : top.accuracy < 50
                          ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {top.accuracy}%
                  </span>
                </td>
                <td className="py-2.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                  {top.answers.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 text-right">
                  <Sparkline points={top.points} color={top.color} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
