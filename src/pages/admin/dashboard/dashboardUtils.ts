import { Users, User, FileText, Database, Crown, IndianRupee } from 'lucide-react';
import type { api } from '@/services/api';
import type { AdminDashboardV2Stats, Exam, MockTest } from '@/types';
import type { DashboardPeriod } from '@/services/domains/admin.reporting';
import { calculatePeriodGrowth } from '@/services/domains/admin.dashboard';

export type DashboardLeaderboard = Awaited<ReturnType<typeof api.getDashboardLeaderboard>>;

export interface DashboardChartPeriods {
  growth: DashboardPeriod;
  attempts: DashboardPeriod;
  revenue: DashboardPeriod;
}

export type AttemptSeriesPoint = DashboardPeriod['attemptSeries'][number];

// ─── 6 TOP KPI METRIC CARDS ───
export function buildMetricCards(
  stats: AdminDashboardV2Stats | null,
  periodData: DashboardPeriod | null,
  dateRangePreset: string
) {
  const totalStudents = stats?.totalStudents ?? 0;
  const activeStudents = periodData?.activeStudents ?? 0;
  const testsAttempted = periodData?.testsAttempted ?? 0;
  const questionsSolved = periodData?.questionsAnswered ?? 0;
  const activeSubscriptions = stats?.activeSubscriptions ?? 0;
  const totalRevenue = periodData?.netRevenue ?? 0;

  const studentGrowth = calculatePeriodGrowth(
    periodData?.newStudents || 0,
    periodData?.previous?.newStudents,
    dateRangePreset
  );
  const activeGrowth = calculatePeriodGrowth(
    activeStudents,
    periodData?.previous?.activeStudents,
    dateRangePreset
  );
  const attemptsGrowth = calculatePeriodGrowth(
    testsAttempted,
    periodData?.previous?.testsAttempted,
    dateRangePreset
  );
  const questionsGrowth = calculatePeriodGrowth(
    questionsSolved,
    periodData?.previous?.questionsAnswered,
    dateRangePreset
  );
  const revenueGrowth = calculatePeriodGrowth(
    totalRevenue,
    periodData?.previous?.netRevenue,
    dateRangePreset
  );

  return [
    {
      id: 'total_students',
      label: 'Total Students',
      value: totalStudents.toLocaleString('en-IN'),
      trend: studentGrowth.trendStr,
      isPositive: studentGrowth.isPositive,
      vsText: `All-time students; signup growth ${studentGrowth.vsLabel}`,
      icon: Users,
      iconBg: 'bg-[#EFF6FF] dark:bg-[#1E293B]',
      iconColor: 'text-[#026BFC]',
      accentHex: '#026BFC',
    },
    {
      id: 'active_students',
      label: 'Active Students',
      value: activeStudents.toLocaleString('en-IN'),
      trend: activeGrowth.trendStr,
      isPositive: activeGrowth.isPositive,
      vsText: activeGrowth.vsLabel,
      icon: User,
      iconBg: 'bg-[#ECFDF5] dark:bg-[#064E3B]/40',
      iconColor: 'text-[#10B981]',
    },
    {
      id: 'tests_attempted',
      label: 'Tests Attempted',
      value: testsAttempted.toLocaleString('en-IN'),
      trend: attemptsGrowth.trendStr,
      isPositive: attemptsGrowth.isPositive,
      vsText: attemptsGrowth.vsLabel,
      icon: FileText,
      iconBg: 'bg-[#F5F3FF] dark:bg-[#4C1D95]/30',
      iconColor: 'text-[#8B5CF6]',
    },
    {
      id: 'questions_solved',
      label: 'Questions Solved',
      value: questionsSolved.toLocaleString('en-IN'),
      trend: questionsGrowth.trendStr,
      isPositive: questionsGrowth.isPositive,
      vsText: questionsGrowth.vsLabel,
      icon: Database,
      iconBg: 'bg-[#FFFBEB] dark:bg-[#78350F]/30',
      iconColor: 'text-[#F59E0B]',
    },
    {
      id: 'active_subscriptions',
      label: 'Active Subscriptions',
      value: activeSubscriptions.toLocaleString('en-IN'),
      trend: 'Active',
      isPositive: null,
      vsText: 'Point-in-time active',
      icon: Crown,
      iconBg: 'bg-[#FFF1F2] dark:bg-[#881337]/30',
      iconColor: 'text-[#F43F5E]',
    },
    {
      id: 'total_revenue',
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      trend: revenueGrowth.trendStr,
      isPositive: revenueGrowth.isPositive,
      vsText: `Net retained revenue; ${revenueGrowth.vsLabel}`,
      icon: IndianRupee,
      iconBg: 'bg-[#EFF6FF] dark:bg-[#1E293B]',
      iconColor: 'text-[#026BFC]',
    },
  ];
}

// Generate SVG curve points dynamically from actual data
export function buildAttemptsSvgPoints(
  testAttemptsData: AttemptSeriesPoint[],
  maxAttempts: number
) {
  const width = 300;
  const height = 120;
  const padX = 25;
  const padY = 20;
  const plotW = width - padX - 15;
  const plotH = height - padY - 20;
  const baselineY = height - 20;

  const n = Math.max(1, testAttemptsData.length - 1);

  const attemptsCoords = testAttemptsData.map((d, i) => {
    const cx = padX + (i / n) * plotW;
    const cy = baselineY - (d.totalAttempts / maxAttempts) * plotH;
    return { cx, cy, val: d.totalAttempts, label: d.label };
  });

  const uniqueCoords = testAttemptsData.map((d, i) => {
    const cx = padX + (i / n) * plotW;
    const cy = baselineY - (d.uniqueStudents / maxAttempts) * plotH;
    return { cx, cy, val: d.uniqueStudents, label: d.label };
  });

  const buildPath = (pts: { cx: number; cy: number }[]) => {
    if (pts.length === 0) return '';
    return pts.reduce(
      (acc, p, idx) => (idx === 0 ? `M ${p.cx},${p.cy}` : `${acc} L ${p.cx},${p.cy}`),
      ''
    );
  };

  const buildAreaPath = (pts: { cx: number; cy: number }[]) => {
    if (pts.length === 0) return '';
    const line = buildPath(pts);
    const lastX = pts[pts.length - 1].cx;
    const firstX = pts[0].cx;
    return `${line} L ${lastX},${baselineY} L ${firstX},${baselineY} Z`;
  };

  return {
    attemptsLine: buildPath(attemptsCoords),
    attemptsArea: buildAreaPath(attemptsCoords),
    attemptsCoords,
    uniqueLine: buildPath(uniqueCoords),
    uniqueArea: buildAreaPath(uniqueCoords),
    uniqueCoords,
    baselineY,
  };
}

// ─── POPULAR EXAMS DATASET (RANKED TRUTHFULLY BY ATTEMPTS) ───
export function buildPopularExams(dbExams: Exam[], examAttemptCounts: Record<string, number>) {
  const examAttemptsList = dbExams.map((exam) => ({
    exam,
    attemptsCount: examAttemptCounts[exam.id] || 0,
  }));

  // Sort by attempts DESC, then title ASC (stable tie-breaker)
  examAttemptsList.sort((a, b) => {
    if (b.attemptsCount !== a.attemptsCount) {
      return b.attemptsCount - a.attemptsCount;
    }
    return a.exam.title.localeCompare(b.exam.title);
  });

  const totalAllExamsAttempts = examAttemptsList.reduce((acc, e) => acc + e.attemptsCount, 0);

  const colors = [
    { bg: 'bg-blue-900', badgeText: 'text-amber-400' },
    { bg: 'bg-slate-800', badgeText: 'text-slate-200' },
    { bg: 'bg-slate-700', badgeText: 'text-amber-300' },
    { bg: 'bg-red-900', badgeText: 'text-rose-200' },
    { bg: 'bg-pink-800', badgeText: 'text-pink-200' },
  ];

  return examAttemptsList.slice(0, 5).map((item, idx) => {
    const clr = colors[idx % colors.length];
    const pct =
      totalAllExamsAttempts > 0
        ? Math.min(100, Math.round((item.attemptsCount / totalAllExamsAttempts) * 100))
        : 0;

    return {
      id: item.exam.id,
      name: item.exam.title,
      slug: item.exam.slug,
      iconName: item.exam.iconName,
      attempts: `${item.attemptsCount.toLocaleString('en-IN')} attempts`,
      percentage: pct,
      code: (item.exam.title || 'EXAM').split(' ')[0],
      bg: clr.bg,
      badgeText: clr.badgeText,
    };
  });
}

// ─── MOST ATTEMPTED TESTS DATASET ───
export function buildMostAttemptedTests(dbTests: MockTest[]) {
  const sortedTests = [...dbTests].sort((a, b) => {
    const countA = a.attemptsCount || 0;
    const countB = b.attemptsCount || 0;
    if (countB !== countA) return countB - countA;
    return (a.title || '').localeCompare(b.title || '');
  });

  const colors = [
    'bg-blue-50 dark:bg-blue-950/60 text-[#026BFC]',
    'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981]',
    'bg-rose-50 dark:bg-rose-950/60 text-[#F43F5E]',
    'bg-amber-50 dark:bg-amber-950/60 text-[#F59E0B]',
    'bg-pink-50 dark:bg-pink-950/60 text-[#EC4899]',
  ];

  return sortedTests.slice(0, 5).map((test, idx) => ({
    id: test.id,
    title: test.title,
    exam: test.examTitle || 'Mock Test',
    attempts: `${(test.attemptsCount || 0).toLocaleString('en-IN')} attempts`,
    iconBg: colors[idx % colors.length],
    iconUrl: test.iconUrl,
  }));
}

// ─── TOP PERFORMING STUDENTS DATASET ───
export function buildTopStudents(dbLeaderboard: DashboardLeaderboard) {
  return dbLeaderboard.slice(0, 5).map((st, idx) => {
    let badge: 'gold' | 'silver' | 'bronze' | 'regular' = 'regular';
    if (idx === 0) badge = 'gold';
    else if (idx === 1) badge = 'silver';
    else if (idx === 2) badge = 'bronze';
    return {
      rank: st.rank || idx + 1,
      name: st.display_name || 'Aspirant',
      location: st.district || 'Not provided',
      score: `${Math.round(st.average_percentage ?? 0)}%`,
      tests: st.tests_count ?? 0,
      badge,
    };
  });
}
