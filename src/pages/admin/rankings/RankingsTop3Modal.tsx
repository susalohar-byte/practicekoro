import { Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRankingsState } from './useAdminRankings';
import { StudentAvatar } from '@/pages/admin/students/StudentAvatar';

export interface RankingsTop3ModalProps {
  rk: AdminRankingsState;
}

export function RankingsTop3Modal({ rk }: RankingsTop3ModalProps) {
  const { studentsList, isTop3ModalOpen, setIsTop3ModalOpen } = rk;
  return (
    <>
      {/* ==================================================================== */}
      {/* 6. VIEW ALL TOP 3 LEADERBOARD MODAL */}
      {/* ==================================================================== */}
      {isTop3ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">State Leaderboard Podium</h3>
              </div>
              <button
                onClick={() => setIsTop3ModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {studentsList.slice(0, 3).map((st) => (
                <div
                  key={st.rank}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2"
                >
                  <span
                    className={cn(
                      'inline-block px-2.5 py-0.5 rounded-full text-xs font-bold',
                      st.rank === 1
                        ? 'bg-amber-100 text-amber-800'
                        : st.rank === 2
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                    )}
                  >
                    Rank #{st.rank}
                  </span>
                  <StudentAvatar
                    avatarUrl={st.avatar}
                    fullName={st.name}
                    initials={st.initials}
                    className="w-14 h-14 rounded-full mx-auto border-2 border-white shadow-md"
                  />
                  <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                  <p className="text-xs text-slate-500">{st.location}</p>
                  <div className="text-xs font-semibold text-slate-700 pt-1">
                    Accuracy: {st.accuracy}% • Avg: {st.avgScore}%
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsTop3ModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900"
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
