import { Crown, Trophy } from 'lucide-react';
import type { AdminRankingsState } from './useAdminRankings';

export interface RankingsTop3CardProps {
  rk: AdminRankingsState;
}

export function RankingsTop3Card({ rk }: RankingsTop3CardProps) {
  const {
    setSelectedStudentRank,
    setIsDetailsOpen,
    top1Student,
    top2Student,
    top3Student,
    setIsTop3ModalOpen,
  } = rk;
  return (
    <>
      {/* 1. TOP 3 STUDENTS CARD */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-sm font-bold text-[#0F172A]">Top 3 Students</h2>
          <button
            onClick={() => setIsTop3ModalOpen(true)}
            className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        {/* 3 Podium Cards Side by Side */}
        {!top1Student && !top2Student && !top3Student ? (
          <div className="py-8 text-center text-slate-400 text-xs">No rankings available yet.</div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 items-end pt-1">
            {/* 2nd Place */}
            {top2Student ? (
              <div
                onClick={() => {
                  setSelectedStudentRank(top2Student.rank);
                  setIsDetailsOpen(true);
                }}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center flex flex-col items-center shadow-2xs hover:border-blue-300 transition-all cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-slate-400 mb-1" />
                {top2Student.avatar ? (
                  <img
                    src={top2Student.avatar}
                    alt={top2Student.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shadow-2xs">
                    {top2Student.initials || top2Student.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <h3 className="text-xs font-bold text-[#0F172A] mt-1 truncate max-w-full">
                  {top2Student.name}
                </h3>
                <p className="text-[10px] text-[#64748B] leading-tight mt-0.5">
                  <span className="font-semibold text-slate-800">{top2Student.accuracy}%</span>{' '}
                  Accuracy
                </p>
                <p className="text-[10px] text-[#64748B] leading-tight">
                  <span className="font-semibold text-slate-800">{top2Student.avgScore}%</span> Avg.
                  Score
                </p>
                <span className="bg-[#DBEAFE] text-[#1D4ED8] font-bold text-[10px] px-2 py-0.5 rounded-full mt-1.5 inline-block">
                  2nd
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* 1st Place */}
            {top1Student ? (
              <div
                onClick={() => {
                  setSelectedStudentRank(top1Student.rank);
                  setIsDetailsOpen(true);
                }}
                className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-2.5 text-center flex flex-col items-center shadow-xs -mt-2 pb-3 hover:border-amber-400 transition-all cursor-pointer relative"
              >
                <Crown className="w-4 h-4 text-amber-500 mb-1" />
                {top1Student.avatar ? (
                  <img
                    src={top1Student.avatar}
                    alt={top1Student.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-amber-300 shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-amber-200 text-amber-800 font-bold text-xs flex items-center justify-center border-2 border-amber-300 shadow-xs">
                    {top1Student.initials || top1Student.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <h3 className="text-xs font-bold text-[#0F172A] mt-1 truncate max-w-full">
                  {top1Student.name}
                </h3>
                <p className="text-[10px] text-[#64748B] leading-tight mt-0.5">
                  <span className="font-semibold text-slate-800">{top1Student.accuracy}%</span>{' '}
                  Accuracy
                </p>
                <p className="text-[10px] text-[#64748B] leading-tight">
                  <span className="font-semibold text-slate-800">{top1Student.avgScore}%</span> Avg.
                  Score
                </p>
                <span className="bg-[#FEF3C7] text-[#B45309] font-bold text-[10px] px-2.5 py-0.5 rounded-full mt-1.5 inline-block">
                  1st
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* 3rd Place */}
            {top3Student ? (
              <div
                onClick={() => {
                  setSelectedStudentRank(top3Student.rank);
                  setIsDetailsOpen(true);
                }}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center flex flex-col items-center shadow-2xs hover:border-blue-300 transition-all cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-700 mb-1" />
                {top3Student.avatar ? (
                  <img
                    src={top3Student.avatar}
                    alt={top3Student.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center shadow-2xs">
                    {top3Student.initials || top3Student.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <h3 className="text-xs font-bold text-[#0F172A] mt-1 truncate max-w-full">
                  {top3Student.name}
                </h3>
                <p className="text-[10px] text-[#64748B] leading-tight mt-0.5">
                  <span className="font-semibold text-slate-800">{top3Student.accuracy}%</span>{' '}
                  Accuracy
                </p>
                <p className="text-[10px] text-[#64748B] leading-tight">
                  <span className="font-semibold text-slate-800">{top3Student.avgScore}%</span> Avg.
                  Score
                </p>
                <span className="bg-[#FFEDD5] text-[#C2410C] font-bold text-[10px] px-2 py-0.5 rounded-full mt-1.5 inline-block">
                  3rd
                </span>
              </div>
            ) : (
              <div />
            )}
          </div>
        )}
      </div>
    </>
  );
}
