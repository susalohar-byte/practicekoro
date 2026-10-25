import { FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRankingsState } from './useAdminRankings';

export interface RankingsRecentAttemptsModalProps {
  rk: AdminRankingsState;
}

export function RankingsRecentAttemptsModal({ rk }: RankingsRecentAttemptsModalProps) {
  const { isRecentAttemptsModalOpen, setIsRecentAttemptsModalOpen, activeStudent } = rk;
  return (
    <>
      {/* ==================================================================== */}
      {/* 9. RECENT ATTEMPTS MODAL */}
      {/* ==================================================================== */}
      {isRecentAttemptsModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Recent Test Submissions</h3>
              </div>
              <button
                onClick={() => setIsRecentAttemptsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {activeStudent.recentAttempts.map((att, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-xs',
                        att.iconBg
                      )}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{att.title}</p>
                      <p className="text-[10px] text-slate-500">{att.timeAgo}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                    {att.scorePercent}%
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsRecentAttemptsModalOpen(false)}
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
