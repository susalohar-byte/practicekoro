import { Flame, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRankingsState } from './useAdminRankings';

export interface RankingsPerformanceModalProps {
  rk: AdminRankingsState;
}

export function RankingsPerformanceModal({ rk }: RankingsPerformanceModalProps) {
  const { isPerformanceModalOpen, setIsPerformanceModalOpen, activeStudent } = rk;
  return (
    <>
      {/* ==================================================================== */}
      {/* 8. PERFORMANCE MODAL */}
      {/* ==================================================================== */}
      {isPerformanceModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-slate-900">All Subject Performance</h3>
              </div>
              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {activeStudent.subjectPerformance.map((subj) => (
                <div key={subj.subject} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{subj.subject}</span>
                    <span>{subj.scorePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', subj.barColor)}
                      style={{ width: `${subj.scorePercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
