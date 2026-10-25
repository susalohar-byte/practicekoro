import { BarChart3, Crown, Trophy, Users } from 'lucide-react';
import type { AdminRankingsState } from './useAdminRankings';

export interface RankingsStatCardsProps {
  rk: AdminRankingsState;
}

export function RankingsStatCards({ rk }: RankingsStatCardsProps) {
  const { studentsList, totalStudentsCount, activeTestTakersCount, topRankScore } = rk;
  return (
    <>
      {/* ==================================================================== */}
      {/* 2. SUMMARY METRIC CARDS (4 CARDS IN A ROW) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Total Students</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {totalStudentsCount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Total enrolled aspirants</p>
          </div>
        </div>

        {/* Card 2: Active Test Takers */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Active Test Takers</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {activeTestTakersCount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Tested aspirants</p>
          </div>
        </div>

        {/* Card 3: Top Rank Score */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Top Rank Score</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {topRankScore}%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Highest accuracy</p>
          </div>
        </div>

        {/* Card 4: Students in Ranking */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Students in Ranking</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {studentsList.length.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">in the current view</p>
          </div>
        </div>
      </div>
    </>
  );
}
