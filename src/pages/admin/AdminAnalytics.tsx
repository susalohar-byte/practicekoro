import { AdminDataBoundary } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAdminAnalytics } from './analytics/useAdminAnalytics';
import { AnalyticsPageHeader } from './analytics/AnalyticsPageHeader';
import { AnalyticsKpiCards } from './analytics/AnalyticsKpiCards';
import { GenderDistributionCard } from './analytics/GenderDistributionCard';
import { StudentGrowthCard } from './analytics/StudentGrowthCard';
import { DistrictDemographicsCard } from './analytics/DistrictDemographicsCard';
import { RevenueSubscriptionsCard } from './analytics/RevenueSubscriptionsCard';
import { WeakestSubjectsCard } from './analytics/WeakestSubjectsCard';
import { WeakestTopicsCard } from './analytics/WeakestTopicsCard';
import { SubjectAnswersCard } from './analytics/SubjectAnswersCard';
import { PracticePackDeliveryCard } from './analytics/PracticePackDeliveryCard';
import { PerformanceInspector } from './analytics/PerformanceInspector';
import { WeakestSubjectsModal } from './analytics/WeakestSubjectsModal';
import { WeakestTopicsModal } from './analytics/WeakestTopicsModal';
import { WeakSubjectStudentsModal } from './analytics/WeakSubjectStudentsModal';
export { analyticsCsv } from './analytics/analyticsCsv';

export const AdminAnalytics: React.FC = () => {
  const analyticsState = useAdminAnalytics();
  const { loading, error, setReload, data, viewAllModal, selectedWeakSubject } = analyticsState;
  return (
    <div className="space-y-5 pb-16 font-sans">
      {/* ==================================================================== */}
      {/* 1. PAGE HEADER & DATE FILTER / EXPORT CONTROLS                       */}
      {/* ==================================================================== */}
      <AnalyticsPageHeader analyticsState={analyticsState} />

      {/* ==================================================================== */}
      {/* DATA BOUNDARY & LOAD ERROR HANDLING                                  */}
      {/* ==================================================================== */}
      <AdminDataBoundary
        loading={loading}
        label="Loading complete analytics records…"
        variant="dashboard"
        showHeader={false}
        preserveContent={false}
        className="space-y-5"
      >
        {error && (
          <div
            role="alert"
            className="rounded-2xl p-4 border border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between"
          >
            <div>
              <span className="font-bold mr-1">Analytics unavailable:</span> {error}
            </div>
            <button
              type="button"
              onClick={() => setReload((v) => v + 1)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold inline-flex items-center gap-1 text-xs shadow-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* ==================================================================== */}
            {/* 2. TOP KPI CARDS (6 STATS IN A ROW AS IN MOCKUP)                     */}
            {/* ==================================================================== */}
            <AnalyticsKpiCards analyticsState={analyticsState} />

            {/* ==================================================================== */}
            {/* 3. ROW 2: GENDER DISTRIBUTION, STUDENT GROWTH, DEMOGRAPHICS          */}
            {/* ==================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Card 1: Student Gender Distribution */}
              <GenderDistributionCard analyticsState={analyticsState} />

              {/* Card 2: Student Growth (Dynamic Multi-curve SVG Chart) */}
              <StudentGrowthCard analyticsState={analyticsState} />

              {/* Card 3: Student Demographics (Location) */}
              <DistrictDemographicsCard analyticsState={analyticsState} />
            </div>

            {/* ==================================================================== */}
            {/* 4. ROW 3: REVENUE & SUBSCRIPTIONS (real totals only)                */}
            {/* ==================================================================== */}
            <RevenueSubscriptionsCard analyticsState={analyticsState} data={data} />

            {/* ==================================================================== */}
            {/* 5. ROW 4: WEAKEST SUBJECTS, WEAKEST TOPICS, SUBJECT WEAK STUDENTS    */}
            {/* ==================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Card 1: Weakest Subjects */}
              <WeakestSubjectsCard analyticsState={analyticsState} />

              {/* Card 2: Weakest Topics */}
              <WeakestTopicsCard analyticsState={analyticsState} />

              {/* Card 3: Subject-wise Weak Students */}
              <SubjectAnswersCard analyticsState={analyticsState} />
            </div>

            {/* ==================================================================== */}
            {/* 7. PRACTICE PACK TARGETING & ACTIONABLE DELIVERY WORKFLOW            */}
            {/* ==================================================================== */}
            <PracticePackDeliveryCard analyticsState={analyticsState} data={data} />

            {/* ==================================================================== */}
            {/* 8. DEEP-DIVE PERFORMANCE INSPECTOR (STUDENT RANKINGS & WRONG Qs)     */}
            {/* ==================================================================== */}
            <PerformanceInspector analyticsState={analyticsState} data={data} />

            {/* ==================================================================== */}
            {/* 9. MODALS: VIEW ALL (SUBJECTS, TOPICS, CATEGORIES, WEAK STUDENTS)     */}
            {/* ==================================================================== */}

            {/* Modal: View All Subjects */}
            {viewAllModal === 'subjects' && (
              <WeakestSubjectsModal analyticsState={analyticsState} />
            )}

            {/* Modal: View All Topics */}
            {viewAllModal === 'topics' && <WeakestTopicsModal analyticsState={analyticsState} />}

            {/* Modal: View All Exam Categories */}
            {/* Modal: Subject Weak Students Detail Inspector */}
            {selectedWeakSubject && (
              <WeakSubjectStudentsModal
                analyticsState={analyticsState}
                data={data}
                selectedWeakSubject={selectedWeakSubject}
              />
            )}
          </>
        )}
      </AdminDataBoundary>
    </div>
  );
};
