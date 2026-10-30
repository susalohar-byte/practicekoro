import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { RevenueAnalyticsHeader } from './revenueAnalytics/RevenueAnalyticsHeader';
import { StudentPerformanceSection } from './revenueAnalytics/StudentPerformanceSection';
import { QuestionInsightsSection } from './revenueAnalytics/QuestionInsightsSection';
import { RevenueSection } from './revenueAnalytics/RevenueSection';
import { StudentRankModal } from './revenueAnalytics/StudentRankModal';
import { useAdminRevenueAnalytics } from './revenueAnalytics/useAdminRevenueAnalytics';

export const AdminRevenueAnalytics: React.FC = () => {
  const ra = useAdminRevenueAnalytics();
  const { isLoading, isRankModalOpen } = ra;
  return withAdminSkeleton(
    isLoading,
    <div className="space-y-8 pb-16">
      <RevenueAnalyticsHeader ra={ra} />

      <StudentPerformanceSection ra={ra} />

      <QuestionInsightsSection ra={ra} />

      <RevenueSection ra={ra} />

      {/* ─── INTERACTIVE RANK / STUDENT LEADERBOARD MODAL ──────────── */}
      {isRankModalOpen && <StudentRankModal ra={ra} />}
    </div>,
    { label: 'Loading revenue analytics…', variant: 'dashboard' }
  );
};
