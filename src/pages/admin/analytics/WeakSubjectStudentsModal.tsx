import { X, Send } from 'lucide-react';
import type { PlatformAnalyticsData } from '@/types';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface WeakSubjectStudentsModalProps {
  analyticsState: AdminAnalyticsState;
  data: PlatformAnalyticsData;
  selectedWeakSubject: NonNullable<AdminAnalyticsState['selectedWeakSubject']>;
}

export function WeakSubjectStudentsModal({
  analyticsState,
  data,
  selectedWeakSubject,
}: WeakSubjectStudentsModalProps) {
  const { setSelectedWeakSubject, displayWeakestTopics, setSelectedTopicId } = analyticsState;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/45 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedWeakSubject.name}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
                {selectedWeakSubject.accuracy}% Avg Accuracy
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Per-student subject accuracy is not reported. Listed below: students with the lowest
              overall answer accuracy in the selected range.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedWeakSubject(null)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {data.studentRankings && data.studentRankings.length > 0 ? (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 font-medium w-8">Rank</th>
                  <th className="py-2 font-medium">Student Name</th>
                  <th className="py-2 font-medium text-center">Questions Attempted</th>
                  <th className="py-2 font-medium text-center">Accuracy</th>
                  <th className="py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...data.studentRankings]
                  .filter((st) => st.questionsAttempted > 0)
                  .sort((a, b) => a.accuracy - b.accuracy)
                  .slice(0, 10)
                  .map((st) => (
                    <tr key={st.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-2.5 text-slate-400 font-semibold">#{st.rank}</td>
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">
                        <div>{st.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{st.email}</div>
                      </td>
                      <td className="py-2.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                        {st.questionsAttempted}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                          {st.accuracy}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const match =
                              displayWeakestTopics.find(
                                (t) => t.subjectName === selectedWeakSubject.name
                              ) || displayWeakestTopics[0];
                            if (match) setSelectedTopicId(match.id);
                            setSelectedWeakSubject(null);
                          }}
                          className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Target
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No individual student attempts recorded in {selectedWeakSubject.name} for this period.
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Answers recorded in subject: {selectedWeakSubject.answers.toLocaleString('en-IN')}
          </span>
          <button
            type="button"
            onClick={() => setSelectedWeakSubject(null)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
