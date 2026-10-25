import { Users, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestDetailsTabsProps {
  live: AdminLiveTestsState;
}

export function LiveTestDetailsTabs({ live }: LiveTestDetailsTabsProps) {
  const {
    statsError,
    drawerTab,
    selectedLiveTest,
    selectedStats,
    selectedNegative,
    exportParticipantsCsv,
  } = live;
  // Rendered inside the details panel, which only opens with a selected Live Test.
  if (!selectedLiveTest) return null;
  return (
    <>
      {/* Tab 2: Participants */}
      {drawerTab === 'participants' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Leaderboard ({selectedStats.submitted} submitted)
            </span>
            <button
              type="button"
              onClick={() => exportParticipantsCsv(selectedLiveTest, selectedStats.leaderboard)}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {selectedStats.leaderboard.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
              <Users className="w-6 h-6 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="font-semibold text-slate-700">No submissions yet</p>
              <p className="text-[11px] text-slate-400">
                {statsError
                  ? `Error loading participants: ${statsError}`
                  : 'When candidates submit this test, real ranks will appear here.'}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white shadow-2xs">
              <div className="grid grid-cols-12 bg-slate-50 px-3 py-2.5 font-bold text-slate-600 border-b border-slate-200">
                <span className="col-span-2 text-center">Rank</span>
                <span className="col-span-5">Candidate</span>
                <span className="col-span-3 text-right">Score</span>
                <span className="col-span-2 text-right">Time</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {selectedStats.leaderboard.map((p) => (
                  <div
                    key={p.userId}
                    className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-50/80 transition-colors"
                  >
                    <span className="col-span-2 text-center font-bold text-slate-700">
                      #{p.rank}
                    </span>
                    <span className="col-span-5 font-semibold text-slate-800 truncate pr-2">
                      {p.name}
                    </span>
                    <span className="col-span-3 text-right font-bold text-emerald-600">
                      {p.score}
                    </span>
                    <span className="col-span-2 text-right text-slate-500 font-medium">
                      {Math.round(p.timeSeconds / 60)}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Settings */}
      {drawerTab === 'settings' && (
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Statewide Ranking</span>
              <span
                className={cn(
                  'font-bold px-2 py-0.5 rounded text-[11px]',
                  selectedLiveTest.rankingEnabled
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-700'
                )}
              >
                {selectedLiveTest.rankingEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Calculates percentile and statewide rank among all candidates automatically upon
              submission.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Negative Marking</span>
              <span className="font-bold text-slate-800">
                {selectedNegative > 0 ? `${selectedNegative} Marks` : 'None'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {selectedNegative > 0
                ? `${selectedNegative} marks deducted per incorrect response.`
                : 'No marks are deducted for incorrect responses.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Access Level</span>
              <span className="font-bold text-slate-800">
                {selectedLiveTest.subscriptionRequired ? 'Pro Pass only' : 'Free for all students'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {selectedLiveTest.subscriptionRequired
                ? 'Only active Pro Pass subscribers can attempt this Live Test.'
                : 'All registered candidates can attempt this Live Test.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Analytics */}
      {drawerTab === 'analytics' && (
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2">
            <span className="font-bold text-slate-800">Top Participating Districts</span>
            {selectedStats.topDistricts.length === 0 ? (
              <p className="pt-1 text-slate-500 text-[11px]">
                {statsError
                  ? `District data could not be loaded: ${statsError}`
                  : 'No participant district data recorded yet.'}
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {selectedStats.topDistricts.map((d) => (
                  <div key={d.name} className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">
                      {d.name} <span className="text-slate-400">({d.count})</span>
                    </span>
                    <span className="font-bold text-slate-900">{d.percent}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
