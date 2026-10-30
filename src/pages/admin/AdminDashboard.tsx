import { AdminDataBoundary } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { PaymentHealthCard } from '@/components/admin/PaymentHealthCard';
import { useAdminDashboard } from './dashboard/useAdminDashboard';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardKpiCards } from './dashboard/DashboardKpiCards';
import { DashboardDateRangePanel } from './dashboard/DashboardDateRangePanel';
import { StudentGrowthChart } from './dashboard/StudentGrowthChart';
import { TestAttemptsChart } from './dashboard/TestAttemptsChart';
import { RevenueChart } from './dashboard/RevenueChart';
import { PopularExamsPanel } from './dashboard/PopularExamsPanel';
import { MostAttemptedTestsPanel } from './dashboard/MostAttemptedTestsPanel';
import { TopStudentsPanel } from './dashboard/TopStudentsPanel';

export const AdminDashboard: React.FC = () => {
  const db = useAdminDashboard();
  const { stats, loadError, loadPlatformData, isLoading, isStale, snapshotLabel, customDateError } =
    db;

  if (!stats && loadError)
    return (
      <div className="space-y-3">
        <h1>Dashboard</h1>
        <div role="alert">{loadError}. No reporting values are available.</div>
        <button onClick={() => void loadPlatformData()}>Retry</button>
      </div>
    );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ─── PAGE HEADER: Title + Date Range Picker + Refresh ─── */}
      <DashboardHeader db={db} />
      <PaymentHealthCard />
      <AdminDataBoundary
        loading={isLoading}
        label="Loading authoritative Dashboard data…"
        variant="dashboard"
        showHeader={false}
        className="space-y-6"
      >
        {/* Error notification banner */}
        {loadError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{loadError}</span>
            </div>
            <button
              onClick={() => loadPlatformData()}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {isStale && stats && (
          <p className="text-amber-700">
            Showing the last complete snapshot: {snapshotLabel}. Selected filters may not match
            until Retry succeeds.
          </p>
        )}
        {/* ─── 6 TOP KPI METRIC CARDS ─── */}
        <DashboardKpiCards db={db} />

        {/* ─── REVENUE & GROWTH ANALYTICS (CUSTOM DATE-RANGE CONTROLS) ─── */}
        <DashboardDateRangePanel db={db} />

        {customDateError && (
          <div role="alert" className="text-red-700">
            {customDateError}
          </div>
        )}
        {/* ─── 3 MIDDLE CHARTS (STUDENT GROWTH, TEST ATTEMPTS, REVENUE) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* CHART 1: Student Growth */}
          <StudentGrowthChart db={db} />

          {/* CHART 2: Test Attempts (Truthful SVG Line Chart) */}
          <TestAttemptsChart db={db} />

          {/* CHART 3: Revenue (Truthful Dynamic Bar Chart) */}
          <RevenueChart db={db} />
        </div>

        {/* ─── BOTTOM GRID ROW 1: MOST POPULAR EXAMS, MOST ATTEMPTED TESTS, TOP PERFORMING STUDENTS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Most Popular Exams */}
          <PopularExamsPanel db={db} />

          {/* Most Attempted Tests */}
          <MostAttemptedTestsPanel db={db} />

          {/* Top Performing Students */}
          <TopStudentsPanel db={db} />
        </div>
      </AdminDataBoundary>
    </div>
  );
};
