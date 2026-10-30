import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '@/services/api';
import type { AdminDashboardV2Stats, Exam, MockTest } from '@/types';
import { getErrorMessage } from '@/lib/errors';
import type { DashboardPeriod } from '@/services/domains/admin.reporting';
import { getDateRangeBounds, type DateRangeBounds } from '@/services/domains/admin.dashboard';
import {
  buildAttemptsSvgPoints,
  buildMetricCards,
  buildMostAttemptedTests,
  buildPopularExams,
  buildTopStudents,
  type DashboardChartPeriods,
  type DashboardLeaderboard,
} from './dashboardUtils';

export function useAdminDashboard() {
  // ─── DATE RANGE FILTER STATE ───
  const [dateRangePreset, setDateRangePreset] = useState('Last 30 Days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [appliedCustomStart, setAppliedCustomStart] = useState('');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState('');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  // Timeframe states for individual charts
  const [studentGrowthRange, setStudentGrowthRange] = useState('Last 30 Days');
  const [testAttemptsRange, setTestAttemptsRange] = useState('Last 30 Days');
  const [revenueRange, setRevenueRange] = useState('Last 30 Days');

  // Hover states for tooltips
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState<number | null>(null);
  const [hoveredGrowthIndex, setHoveredGrowthIndex] = useState<number | null>(null);
  const [hoveredAttemptIndex, setHoveredAttemptIndex] = useState<number | null>(null);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Live Database Sync States
  const [stats, setStats] = useState<AdminDashboardV2Stats | null>(null);
  const [dbExams, setDbExams] = useState<Exam[]>([]);
  const [dbTests, setDbTests] = useState<MockTest[]>([]);
  const [dbLeaderboard, setDbLeaderboard] = useState<DashboardLeaderboard>([]);
  const [periodData, setPeriodData] = useState<DashboardPeriod | null>(null);
  const [chartPeriods, setChartPeriods] = useState<DashboardChartPeriods | null>(null);
  const [examAttemptCounts, setExamAttemptCounts] = useState<Record<string, number>>({});
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [customDateError, setCustomDateError] = useState('');

  // Sequence token to prevent out-of-order race conditions
  const requestIdRef = useRef(0);

  // Compute effective date bounds in Asia/Kolkata timezone
  const dateBounds: DateRangeBounds = useMemo(() => {
    return getDateRangeBounds(
      dateRangePreset,
      appliedCustomStart || undefined,
      appliedCustomEnd || undefined
    );
  }, [dateRangePreset, appliedCustomStart, appliedCustomEnd]);
  // Load real backend data
  const loadPlatformData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError(null);

    try {
      const bounds = getDateRangeBounds(
        dateRangePreset,
        appliedCustomStart || undefined,
        appliedCustomEnd || undefined
      );

      // Share identical period queries inside a refresh; chart selectors use real bounds.
      const cache = new Map<string, Promise<DashboardPeriod>>();
      const periodFor = (range: string) => {
        const b = getDateRangeBounds(
          range,
          range === 'Custom Range' ? appliedCustomStart : undefined,
          range === 'Custom Range' ? appliedCustomEnd : undefined
        );
        const key = JSON.stringify(b);
        if (!cache.has(key)) cache.set(key, api.getDashboardPeriodData(b));
        return cache.get(key)!;
      };
      const [
        statsRes,
        examsRes,
        testsRes,
        lbRes,
        currentPeriod,
        growthPeriod,
        attemptPeriod,
        revenuePeriod,
      ] = await Promise.all([
        api.getAdminDashboardV2Stats(),
        api.getAllAdminExams(),
        api.getAllAdminTests(),
        api.getDashboardLeaderboard(bounds),
        periodFor(dateRangePreset),
        periodFor(studentGrowthRange),
        periodFor(testAttemptsRange),
        periodFor(revenueRange),
      ]);
      const counts = await api.getDashboardExamAttemptCounts(currentPeriod.attemptCounts);
      if (currentRequestId !== requestIdRef.current) return;
      // Publish one complete snapshot. A failed section preserves the previous complete one.
      setStats(statsRes);
      setDbExams(examsRes);
      setDbTests(
        testsRes.map((test) => ({
          ...test,
          attemptsCount: currentPeriod.attemptCounts[test.id] || 0,
        }))
      );
      setDbLeaderboard(lbRes);
      setPeriodData(currentPeriod);
      setChartPeriods({ growth: growthPeriod, attempts: attemptPeriod, revenue: revenuePeriod });
      setExamAttemptCounts(counts);
      setSnapshotLabel(bounds.label);
      setIsStale(false);
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        console.error('AdminDashboard data fetch failed:', err);
        setLoadError(
          `Failed to load dashboard data. Backend did not respond. ${getErrorMessage(err, 'Please retry.')}`
        );
        setIsStale(true);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    dateRangePreset,
    appliedCustomStart,
    appliedCustomEnd,
    studentGrowthRange,
    testAttemptsRange,
    revenueRange,
  ]);

  useEffect(() => {
    loadPlatformData();
  }, [loadPlatformData]);

  // Handle Preset Click
  const handleSelectPreset = (preset: string) => {
    setCustomDateError('');
    if (preset === 'Custom Range') {
      setShowCustomInputs(true);
      setIsDateOpen(false);
      return;
    }
    setDateRangePreset(preset);
    setStudentGrowthRange(preset);
    setTestAttemptsRange(preset);
    setRevenueRange(preset);
    setShowCustomInputs(false);
    setAppliedCustomStart('');
    setAppliedCustomEnd('');
    setIsDateOpen(false);
  };
  const handleApplyCustomDate = () => {
    try {
      getDateRangeBounds('Custom Range', customStartDate, customEndDate || customStartDate);
    } catch (error) {
      setCustomDateError(error instanceof Error ? error.message : 'Invalid date range');
      return;
    }
    setCustomDateError('');
    setAppliedCustomStart(customStartDate);
    setAppliedCustomEnd(customEndDate || customStartDate);
    setDateRangePreset('Custom Range');
    setStudentGrowthRange('Custom Range');
    setTestAttemptsRange('Custom Range');
    setRevenueRange('Custom Range');
    setIsDateOpen(false);
    setShowCustomInputs(false);
  };

  // ─── 6 TOP KPI METRIC CARDS ───
  const metricCards = useMemo(
    () => buildMetricCards(stats, periodData, dateRangePreset),
    [stats, dateRangePreset, periodData]
  );

  // ─── CHART 1: STUDENT GROWTH DATASET ───
  const studentGrowthData = useMemo(() => chartPeriods?.growth.growthSeries || [], [chartPeriods]);

  const maxGrowthStudents = useMemo(() => {
    const m = Math.max(
      ...studentGrowthData.map((d) => Math.max(d.newStudents, d.activeStudents)),
      0
    );
    return Math.max(m, 10);
  }, [studentGrowthData]);

  // ─── CHART 2: TEST ATTEMPTS DATASET (DYNAMIC SVG PATH) ───
  const testAttemptsData = useMemo(
    () => chartPeriods?.attempts.attemptSeries || [],
    [chartPeriods]
  );

  const maxAttempts = useMemo(() => {
    const m = Math.max(
      ...testAttemptsData.map((d) => Math.max(d.totalAttempts, d.uniqueStudents)),
      0
    );
    return Math.max(m, 10);
  }, [testAttemptsData]);

  // Generate SVG curve points dynamically from actual data
  const attemptsSvgPoints = useMemo(
    () => buildAttemptsSvgPoints(testAttemptsData, maxAttempts),
    [testAttemptsData, maxAttempts]
  );

  // ─── CHART 3: REVENUE DATASET ───
  const revenueData = useMemo(() => chartPeriods?.revenue.revenueSeries || [], [chartPeriods]);

  const maxRevenue = useMemo(() => {
    const m = Math.max(...revenueData.map((d) => d.amount), 0);
    return Math.max(m, 1000);
  }, [revenueData]);

  // ─── POPULAR EXAMS DATASET (RANKED TRUTHFULLY BY ATTEMPTS) ───
  const popularExams = useMemo(() => {
    if (!dbExams || dbExams.length === 0) return [];
    return buildPopularExams(dbExams, examAttemptCounts);
  }, [dbExams, examAttemptCounts]);

  // ─── MOST ATTEMPTED TESTS DATASET ───
  const mostAttemptedTests = useMemo(() => {
    if (!dbTests || dbTests.length === 0) return [];
    return buildMostAttemptedTests(dbTests);
  }, [dbTests]);

  // ─── TOP PERFORMING STUDENTS DATASET ───
  const topStudents = useMemo(() => {
    if (!dbLeaderboard || dbLeaderboard.length === 0) return [];
    return buildTopStudents(dbLeaderboard);
  }, [dbLeaderboard]);

  return {
    dateRangePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    isDateOpen,
    setIsDateOpen,
    showCustomInputs,
    studentGrowthRange,
    setStudentGrowthRange,
    testAttemptsRange,
    setTestAttemptsRange,
    revenueRange,
    setRevenueRange,
    hoveredRevenueIndex,
    setHoveredRevenueIndex,
    hoveredGrowthIndex,
    setHoveredGrowthIndex,
    hoveredAttemptIndex,
    setHoveredAttemptIndex,
    isLoading,
    loadError,
    isStale,
    stats,
    snapshotLabel,
    customDateError,
    dateBounds,
    loadPlatformData,
    handleSelectPreset,
    handleApplyCustomDate,
    metricCards,
    studentGrowthData,
    maxGrowthStudents,
    testAttemptsData,
    maxAttempts,
    attemptsSvgPoints,
    revenueData,
    maxRevenue,
    popularExams,
    mostAttemptedTests,
    topStudents,
  };
}

export type AdminDashboardState = ReturnType<typeof useAdminDashboard>;
