import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { useAdminRankings } from './rankings/useAdminRankings';
import { RankingsHeader } from './rankings/RankingsHeader';
import { RankingsStatCards } from './rankings/RankingsStatCards';
import { RankingsScopeTabs } from './rankings/RankingsScopeTabs';
import { RankingsFilterToolbar } from './rankings/RankingsFilterToolbar';
import { RankingsTablePanel } from './rankings/RankingsTablePanel';
import { RankingsTop3Card } from './rankings/RankingsTop3Card';
import { RankingsStudentDetailsCard } from './rankings/RankingsStudentDetailsCard';
import { RankingsTop3Modal } from './rankings/RankingsTop3Modal';
import { RankingsStudentProfileModal } from './rankings/RankingsStudentProfileModal';
import { RankingsPerformanceModal } from './rankings/RankingsPerformanceModal';
import { RankingsRecentAttemptsModal } from './rankings/RankingsRecentAttemptsModal';
export type { RankingStudent } from './rankings/rankingsUtils';

export const AdminRankings: React.FC = () => {
  const rk = useAdminRankings();
  const { isLoading } = rk;
  return withAdminSkeleton(
    isLoading,
    <div className="space-y-4 pb-12 animate-in fade-in duration-300 font-sans">
      <RankingsHeader rk={rk} />

      <RankingsStatCards rk={rk} />

      <RankingsScopeTabs rk={rk} />

      <RankingsFilterToolbar rk={rk} />

      {/* ==================================================================== */}
      {/* 5. MAIN CONTENT SPLIT: TABLE (LEFT) + CARDS (RIGHT) */}
      {/* ==================================================================== */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        <RankingsTablePanel rk={rk} />

        {/* ==================== RIGHT: TWO STACKED CARDS ==================== */}
        <div className="w-full xl:w-[380px] shrink-0 space-y-4">
          <RankingsTop3Card rk={rk} />

          <RankingsStudentDetailsCard rk={rk} />
        </div>
      </div>

      <RankingsTop3Modal rk={rk} />

      <RankingsStudentProfileModal rk={rk} />

      <RankingsPerformanceModal rk={rk} />

      <RankingsRecentAttemptsModal rk={rk} />
    </div>,
    { label: 'Loading rankings…', variant: 'table' }
  );
};
