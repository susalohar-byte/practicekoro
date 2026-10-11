import { csvCell } from '@/utils/csvExport';
import { AdminDataBoundary } from '@/components/admin/AdminSkeleton';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  RefreshCw,
  Calendar,
  Users,
  UserCheck,
  UserPlus,
  FileText,
  BookOpen,
  Target,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  X,
  Search,
  Award,
  AlertTriangle,
  Send,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/services/api';
import { analyticsRange } from '@/services/domains/admin.analytics';
import { getKolkataDateString } from '@/services/domains/admin.dashboard';
import type { DateRangePreset, PlatformAnalyticsData } from '@/types';

export function analyticsCsv(data: PlatformAnalyticsData, period: string) {
  const rows = [
    ['Metric', 'Value', 'Scope'],
    ['Total students', data.studentPerformance.totalStudents, 'Current student profiles'],
    ['New students', data.studentPerformance.newStudents ?? 'Unavailable', period],
    ['Active students', data.studentPerformance.activeStudents, period],
    ['Tests started', data.studentPerformance.testsAttempted, period],
    ['Answered questions', data.studentPerformance.questionsAnswered, period],
    ['Accuracy (%)', data.studentPerformance.overallAccuracy, period],
    ['Retained revenue (INR)', data.revenue.totalRevenue, period],
    ['Distinct paying students', data.revenue.paidStudents, period],
    ['Active Pro students', data.revenue.activeSubscriptions, 'Current unexpired subscriptions'],
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

// Mini Sparkline Component
const Sparkline: React.FC<{ points: number[]; color: string }> = ({ points, color }) => {
  if (!points || points.length < 2) return <span className="text-[10px] text-slate-400">—</span>;
  const safePoints = points;
  const min = Math.min(...safePoints);
  const max = Math.max(...safePoints);
  const range = max - min || 1;
  const width = 56;
  const height = 18;
  const step = width / Math.max(1, safePoints.length - 1);
  const coords = safePoints
    .map((p, i) => `${i * step},${height - ((p - min) / range) * (height - 4) - 2}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
};

// Donut Chart Component
interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

const DonutChart: React.FC<{
  slices: DonutSlice[];
  centerValue: string;
  centerLabel: string;
  size?: number;
  strokeWidth?: number;
}> = ({ slices, centerValue, centerLabel, size = 130, strokeWidth = 14 }) => {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
      >
        {slices.map((slice, idx) => {
          const slicePercent = slice.value / total;
          const strokeDasharray = `${slicePercent * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativePercent * circumference;
          cumulativePercent += slicePercent;

          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
          {centerValue}
        </span>
        <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-none mt-0.5">
          {centerLabel}
        </span>
      </div>
    </div>
  );
};

// Helper: Cubic Bezier path generator for smooth trend curves
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const AdminAnalytics: React.FC = () => {
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const today = getKolkataDateString(new Date());
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<PlatformAnalyticsData | null>(null);
  const [loadedPeriod, setLoadedPeriod] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Topic Practice Pack Delivery state
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'pro'>('active');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchNotice, setDispatchNotice] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modals for deep-dive inspections
  const [viewAllModal, setViewAllModal] = useState<'subjects' | 'topics' | null>(null);
  const [selectedWeakSubject, setSelectedWeakSubject] = useState<{
    id: string;
    name: string;
    accuracy: number;
    answers: number;
  } | null>(null);

  // Deep-dive section toggle & search
  const [deepDiveTab, setDeepDiveTab] = useState<'rankings' | 'wrongQuestions'>('rankings');
  const [rankingsSearch, setRankingsSearch] = useState('');
  const [wrongQuestionsSearch, setWrongQuestionsSearch] = useState('');

  const handleDispatchPracticePack = async () => {
    if (!selectedTopicId) return;
    const topic = data?.questionInsights.weakestTopics.find((t) => t.chapterId === selectedTopicId);
    const topicName = topic?.chapterName || 'Selected Topic';
    setIsDispatching(true);
    setDispatchNotice(null);
    const title = `🎯 Practice Pack: ${topicName}`;
    const message = `A focused practice pack for ${topicName} has been recommended to target your weak areas. Practice smart and boost your score!`;
    try {
      if (targetAudience === 'active') {
        // Only students with recorded activity in the selected range receive this pack.
        const userIds = [...new Set((data?.studentRankings || []).map((s) => s.userId))];
        if (userIds.length === 0) throw new Error('No active test takers in the selected range.');
        const result = await api.createTargetedNotification({
          title,
          message,
          channel: 'in_app',
          userIds,
        });
        if (!result.success) throw new Error(result.error || 'Delivery was not confirmed.');
        setDispatchNotice({
          kind: 'success',
          text: `Practice pack on "${topicName}" sent to ${userIds.length.toLocaleString('en-IN')} active test takers.`,
        });
      } else {
        await api.createNotification({
          title,
          message,
          targetAudience,
          channel: 'in_app',
          status: 'sent',
        });
        setDispatchNotice({
          kind: 'success',
          text: `Practice pack on "${topicName}" sent to ${targetAudience === 'pro' ? 'Pro' : 'all'} students.`,
        });
      }
    } catch (err) {
      setDispatchNotice({
        kind: 'error',
        text: `Practice pack was not sent: ${err instanceof Error ? err.message : 'delivery failed'}.`,
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const range = useMemo(() => {
    try {
      return analyticsRange(preset, start, end);
    } catch {
      return null;
    }
  }, [preset, start, end]);

  const period = range
    ? `${getKolkataDateString(new Date(range.startIso))} → ${getKolkataDateString(new Date(range.endIso))}`
    : '';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setData(null);
    if (!range) {
      setError('Choose a valid start date on or before the end date.');
      setLoading(false);
      return;
    }
    api
      .getPlatformAnalyticsOverview(
        preset,
        preset === 'custom' ? start : undefined,
        preset === 'custom' ? end : undefined
      )
      .then((result) => {
        if (active) {
          setData(result);
          setLoadedPeriod(period);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Analytics could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [preset, start, end, reload, range, period]);

  const download = () => {
    if (!data || loading || error || loadedPeriod !== period) return;
    const url = URL.createObjectURL(
      new Blob([analyticsCsv(data, loadedPeriod)], { type: 'text/csv;charset=utf-8;' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `PracticeKoro_Analytics_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Base card styling matching user mockup
  const card =
    'bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm';

  // Derived demographics and telemetry
  // Real values only: a genuine zero is shown as zero, never replaced with a sample figure.
  const totalStudentsCount = data?.studentPerformance?.totalStudents ?? 0;
  const activeStudentsCount = data?.studentPerformance?.activeStudents ?? 0;
  const newStudentsCount = data?.studentPerformance?.newStudents ?? 0;
  const testsAttemptedCount = data?.studentPerformance?.testsAttempted ?? 0;
  const questionsAnsweredCount = data?.studentPerformance?.questionsAnswered ?? 0;
  const overallAccuracyVal = data?.studentPerformance?.overallAccuracy ?? 0;
  const retainedRevenueVal = data?.revenue?.totalRevenue ?? 0;

  // Gender data: recorded profile genders only (no benchmark split is invented).
  const displayGenderStats = useMemo(() => {
    const rawGenders = data?.demographics?.genders || [];
    const count = (label: string) =>
      rawGenders.find((g) => g.gender.toLowerCase() === label.toLowerCase())?.studentCount ?? 0;
    const maleCount = count('Male');
    const femaleCount = count('Female');
    const otherCount = count('Other');
    const notSpecifiedCount = count('Not specified');
    const total = maleCount + femaleCount + otherCount + notSpecifiedCount;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    const items = [
      { label: 'Male', count: maleCount, color: '#0267FF', dotColor: 'bg-[#0267FF]' },
      { label: 'Female', count: femaleCount, color: '#FF5E90', dotColor: 'bg-[#FF5E90]' },
      { label: 'Other', count: otherCount, color: '#7F7D8B', dotColor: 'bg-[#7F7D8B]' },
      {
        label: 'Not specified',
        count: notSpecifiedCount,
        color: '#CBD5E1',
        dotColor: 'bg-[#CBD5E1]',
      },
    ];
    return {
      total,
      slices: items
        .filter((i) => i.count > 0)
        .map((i) => ({ label: i.label, value: i.count, color: i.color })),
      items: items.map((i) => ({ ...i, pct: pct(i.count) })),
    };
  }, [data?.demographics?.genders]);

  // ==========================================================================
  // REAL DATA MAPPINGS WITH RESILIENT FALLBACKS
  // ==========================================================================

  // 1. Weakest Subjects (Dynamic from data.questionInsights.weakestSubjects)
  const displayWeakestSubjects = useMemo(() => {
    const real = data?.questionInsights?.weakestSubjects;
    if (real && real.length > 0) {
      return real.map((sub, idx) => {
        const trendPoints: number[] = [];
        if (data?.historicalSubjectTrends) {
          for (const pt of data.historicalSubjectTrends) {
            const match = pt.subjects.find((s) => s.subjectId === sub.subjectId);
            if (match) trendPoints.push(match.accuracy);
          }
        }
        // Only real bucketed accuracy is drawn; fewer than two points draws no sparkline.
        const points = trendPoints.length >= 2 ? trendPoints : [];
        const color =
          sub.accuracyRate < 50 ? '#EF4444' : sub.accuracyRate < 60 ? '#F59E0B' : '#10B981';
        return {
          rank: idx + 1,
          id: sub.subjectId,
          name: sub.subjectName,
          accuracy: sub.accuracyRate,
          answers: sub.totalQuestionsAttempted,
          points,
          color,
        };
      });
    }
    return [];
  }, [data?.questionInsights?.weakestSubjects, data?.historicalSubjectTrends]);

  // 2. Weakest Topics (Dynamic from data.questionInsights.weakestTopics)
  const displayWeakestTopics = useMemo(() => {
    const real = data?.questionInsights?.weakestTopics;
    if (real && real.length > 0) {
      return real.map((t, idx) => {
        const color = t.accuracyRate < 40 ? '#EF4444' : t.accuracyRate < 50 ? '#F97316' : '#10B981';
        return {
          rank: idx + 1,
          id: t.chapterId,
          name: t.chapterName,
          subjectName: t.subjectName,
          accuracy: t.accuracyRate,
          answers: t.totalQuestionsAttempted,
          // Per-topic history is not reported, so no trend line is invented.
          points: [] as number[],
          color,
        };
      });
    }
    return [];
  }, [data?.questionInsights?.weakestTopics]);

  // 4. Student Demographics: recorded profile districts only
  const demographicsData = useMemo(() => {
    const real = data?.demographics?.districts || [];
    const total = real.reduce((sum, d) => sum + d.studentCount, 0);
    if (!total) return [];
    const top = real.slice(0, 6);
    const othersCount = real.slice(6).reduce((sum, d) => sum + d.studentCount, 0);
    const list = top.map((d, idx) => ({
      name: d.district,
      count: d.studentCount,
      pct: Math.round((d.studentCount / total) * 100),
      color:
        idx === 0
          ? 'bg-blue-600'
          : idx === 1
            ? 'bg-blue-500'
            : idx === 2
              ? 'bg-blue-400'
              : 'bg-slate-400',
    }));
    if (othersCount > 0)
      list.push({
        name: 'Others',
        count: othersCount,
        pct: Math.round((othersCount / total) * 100),
        color: 'bg-slate-400',
      });
    return list;
  }, [data?.demographics?.districts]);

  // 5. Student Growth Chart from real range buckets (signups and tests attempted)
  const growthChartData = useMemo(() => {
    const trend = data?.studentPerformance?.performanceTrend || [];
    const revTrend = data?.revenue?.revenueTrend || [];
    if (trend.length < 2) return null;
    const maxVal = Math.max(
      ...trend.map((t) => t.attemptsCount),
      ...revTrend.map((r) => r.signups || 0),
      1
    );
    const count = trend.length;
    const greenPoints = trend.map((t, idx) => ({
      x: 50 + (idx / (count - 1)) * 430,
      y: 145 - (t.attemptsCount / maxVal) * 115,
      val: t.attemptsCount,
      label: t.label,
    }));
    // Signups share the same buckets; a missing bucket is a real zero, not an estimate.
    const bluePoints = trend.map((t, idx) => {
      const signups = revTrend.find((r) => r.date === t.date)?.signups ?? 0;
      return {
        x: 50 + (idx / (count - 1)) * 430,
        y: 145 - (signups / maxVal) * 115,
        val: signups,
        label: trend[idx]?.label,
      };
    });
    return {
      labels: trend.map((t) => t.label || t.date),
      maxVal,
      greenPoints,
      bluePoints,
      greenPath: generateSmoothPath(greenPoints),
      bluePath: generateSmoothPath(bluePoints),
    };
  }, [data?.studentPerformance?.performanceTrend, data?.revenue?.revenueTrend]);

  // Filtered lists for deep-dive section
  const filteredStudentRankings = useMemo(() => {
    const list = data?.studentRankings || [];
    if (!rankingsSearch.trim()) return list;
    const q = rankingsSearch.toLowerCase();
    return list.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [data?.studentRankings, rankingsSearch]);

  const filteredWrongQuestions = useMemo(() => {
    const list = data?.questionInsights?.mostWrongQuestions || [];
    if (!wrongQuestionsSearch.trim()) return list;
    const q = wrongQuestionsSearch.toLowerCase();
    return list.filter(
      (item) =>
        item.questionText.toLowerCase().includes(q) ||
        (item.questionBengaliText && item.questionBengaliText.toLowerCase().includes(q)) ||
        item.subjectName.toLowerCase().includes(q) ||
        item.chapterName.toLowerCase().includes(q)
    );
  }, [data?.questionInsights?.mostWrongQuestions, wrongQuestionsSearch]);

  return (
    <div className="space-y-5 pb-16 font-sans">
      {/* ==================================================================== */}
      {/* 1. PAGE HEADER & DATE FILTER / EXPORT CONTROLS                       */}
      {/* ==================================================================== */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Analytics &amp; Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Understand your students, content performance, subscriptions and growth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector Pill */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              aria-label="Reporting period"
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
              value={preset}
              onChange={(e) => setPreset(e.target.value as DateRangePreset)}
            >
              <option value="30d">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Inputs if active */}
          {preset === 'custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1 text-xs">
              <label className="text-[11px] text-slate-500">
                Start:
                <input
                  aria-label="Start date"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="ml-1 bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </label>
              <span className="text-slate-300">→</span>
              <label className="text-[11px] text-slate-500">
                End:
                <input
                  aria-label="End date"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="ml-1 bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </label>
            </div>
          )}

          {/* Export Report Button */}
          <button
            type="button"
            disabled={!data || loading || !!error || loadedPeriod !== period}
            onClick={download}
            className="bg-white dark:bg-[#0B132B] border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </header>

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
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {/* Card 1: Total Students */}
              <div className={card}>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Total Students
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {totalStudentsCount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    +{newStudentsCount.toLocaleString('en-IN')} in selected range
                  </p>
                </div>
              </div>

              {/* Card 2: Active Students */}
              <div className={card}>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-2xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Active Students
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {activeStudentsCount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    {Math.round((activeStudentsCount / Math.max(1, totalStudentsCount)) * 100)}% of
                    total
                  </p>
                </div>
              </div>

              {/* Card 3: New Students */}
              <div className={card}>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shadow-2xs">
                    <UserPlus className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    New Students
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {newStudentsCount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    in selected range
                  </p>
                </div>
              </div>

              {/* Card 4: Tests Attempted */}
              <div className={card}>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Tests Attempted
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {testsAttemptedCount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    in selected range
                  </p>
                </div>
              </div>

              {/* Card 5: Questions Answered */}
              <div className={card}>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shadow-2xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Questions Answered
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {questionsAnsweredCount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    in selected range
                  </p>
                </div>
              </div>

              {/* Card 6: Overall Accuracy */}
              <div className={card}>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center shadow-2xs">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Overall Accuracy
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {overallAccuracyVal}%
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    correct / answered
                  </p>
                </div>
              </div>
            </div>

            {/* ==================================================================== */}
            {/* 3. ROW 2: GENDER DISTRIBUTION, STUDENT GROWTH, DEMOGRAPHICS          */}
            {/* ==================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Card 1: Student Gender Distribution */}
              <div className={`lg:col-span-4 ${card} flex flex-col justify-between`}>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Student Gender Distribution
                </h2>

                {displayGenderStats.total === 0 ? (
                  <p className="my-auto py-8 text-center text-xs text-slate-400">
                    No student profiles recorded yet.
                  </p>
                ) : (
                  <div className="flex items-center justify-between gap-4 sm:gap-6 my-auto py-3">
                    {/* Left: Donut Chart */}
                    <div className="shrink-0">
                      <DonutChart
                        slices={displayGenderStats.slices}
                        centerValue={displayGenderStats.total.toLocaleString('en-IN')}
                        centerLabel="Students"
                        size={110}
                        strokeWidth={14}
                      />
                    </div>

                    {/* Right: Legend */}
                    <div className="space-y-3.5 text-xs flex-1 min-w-0 pl-1 sm:pl-2">
                      {displayGenderStats.items.map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dotColor}`}
                            />
                            <span className="text-slate-600 dark:text-slate-300 font-medium text-xs truncate">
                              {item.label}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap text-right tabular-nums">
                            {item.count.toLocaleString('en-IN')}&nbsp;({item.pct}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Student Growth (Dynamic Multi-curve SVG Chart) */}
              <div className={`lg:col-span-4 ${card} flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Student Growth
                  </h2>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-blue-600" /> New Students
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tests Attempted
                    </span>
                  </div>
                </div>

                {/* SVG Curve Multi-line Chart */}
                {!growthChartData ? (
                  <p className="h-[180px] flex items-center justify-center text-xs text-slate-400">
                    Not enough activity in this range to draw a trend.
                  </p>
                ) : (
                  <>
                    <div className="h-[180px] w-full mt-3 relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
                        {/* Background Grid Lines & Y-axis Labels */}
                        {[
                          { y: 15, label: `${growthChartData.maxVal.toLocaleString('en-IN')}` },
                          {
                            y: 50,
                            label: `${Math.round(growthChartData.maxVal * 0.75).toLocaleString('en-IN')}`,
                          },
                          {
                            y: 85,
                            label: `${Math.round(growthChartData.maxVal * 0.5).toLocaleString('en-IN')}`,
                          },
                          {
                            y: 120,
                            label: `${Math.round(growthChartData.maxVal * 0.25).toLocaleString('en-IN')}`,
                          },
                          { y: 155, label: '0' },
                        ].map((g) => (
                          <g key={g.y}>
                            <text
                              x="0"
                              y={g.y + 4}
                              className="text-[10px] fill-slate-400"
                              textAnchor="start"
                            >
                              {g.label}
                            </text>
                            <line
                              x1="38"
                              y1={g.y}
                              x2="495"
                              y2={g.y}
                              stroke="#E2E8F0"
                              strokeDasharray="3 3"
                              strokeWidth="1"
                              className="dark:stroke-slate-800"
                            />
                          </g>
                        ))}

                        {/* Green Line (Active Students) Curve */}
                        <path
                          d={growthChartData.greenPath}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Blue Line (New Students) Curve */}
                        <path
                          d={growthChartData.bluePath}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Green Point markers */}
                        {growthChartData.greenPoints.map((p, idx) => (
                          <circle
                            key={`g-${idx}`}
                            cx={p.x}
                            cy={p.y}
                            r="3.5"
                            fill="#10B981"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-transform hover:scale-150 cursor-pointer"
                          >
                            <title>{`Active Students: ${p.val.toLocaleString('en-IN')} (${p.label})`}</title>
                          </circle>
                        ))}

                        {/* Blue Point markers */}
                        {growthChartData.bluePoints.map((p, idx) => (
                          <circle
                            key={`b-${idx}`}
                            cx={p.x}
                            cy={p.y}
                            r="3.5"
                            fill="#2563EB"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-transform hover:scale-150 cursor-pointer"
                          >
                            <title>{`New Students: ${p.val.toLocaleString('en-IN')} (${p.label})`}</title>
                          </circle>
                        ))}
                      </svg>
                    </div>

                    {/* X-axis date points */}
                    <div className="flex justify-between text-[10px] text-slate-400 pl-8 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {growthChartData.labels.map((lbl, idx) => (
                        <span key={idx}>{lbl}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Card 3: Student Demographics (Location) */}
              <div className={`lg:col-span-4 ${card} flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Student Demographics (Location)
                  </h2>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    By District
                  </span>
                </div>

                {/* Map Silhouette & Horizontal Progress Bars */}
                <div className="grid grid-cols-12 gap-3 items-center py-2">
                  {/* Left: Map Graphic */}
                  <div className="col-span-4 h-36 flex items-center justify-center p-1 relative">
                    <img
                      src="/images/west_bengal_silhouette.svg"
                      alt="Bengal Region Map"
                      className="w-full h-full object-contain filter drop-shadow-sm opacity-90"
                    />
                  </div>

                  {/* Right: Progress bars */}
                  <div className="col-span-8 space-y-1.5 text-xs">
                    {demographicsData.length === 0 && (
                      <p className="text-center text-slate-400">No district data recorded.</p>
                    )}
                    {demographicsData.map((loc) => (
                      <div key={loc.name} className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 w-20 truncate">
                          {loc.name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 w-7 text-right">
                          {loc.pct}%
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${loc.color} rounded-full`}
                            style={{ width: `${loc.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                  <span>
                    Top hub:{' '}
                    {data?.demographics?.districts && data.demographics.districts.length > 0
                      ? `${data.demographics.districts[0].district}${
                          data.demographics.districts[1]
                            ? ` & ${data.demographics.districts[1].district}`
                            : ''
                        } districts`
                      : '—'}
                  </span>
                  <a
                    href="/admin/district-rankings"
                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    District Rankings <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* ==================================================================== */}
            {/* 4. ROW 3: REVENUE & SUBSCRIPTIONS (real totals only)                */}
            {/* ==================================================================== */}
            <div className={card}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Revenue &amp; Subscriptions
                </h2>
                <div className="flex items-center gap-3 text-[11px]">
                  <a href="/admin/subscriptions" className="text-blue-600 hover:underline">
                    Manage Plans →
                  </a>
                  <a href="/admin/payments" className="text-blue-600 hover:underline">
                    View Payments →
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                {[
                  {
                    label: 'Net revenue (selected range)',
                    value: `₹${retainedRevenueVal.toLocaleString('en-IN')}`,
                  },
                  {
                    label: 'Net revenue, current month',
                    value: `₹${(data.revenue?.monthlyRevenue ?? 0).toLocaleString('en-IN')}`,
                  },
                  {
                    label: 'Distinct paying students',
                    value: (data.revenue?.paidStudents ?? 0).toLocaleString('en-IN'),
                  },
                  {
                    label: 'Active Pro students',
                    value: (data.revenue?.activeSubscriptions ?? 0).toLocaleString('en-IN'),
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-slate-100 dark:border-slate-800 p-3"
                  >
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {m.label}
                    </p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ==================================================================== */}
            {/* 5. ROW 4: WEAKEST SUBJECTS, WEAKEST TOPICS, SUBJECT WEAK STUDENTS    */}
            {/* ==================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Card 1: Weakest Subjects */}
              <div className={card}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weakest Subjects
                  </h2>
                  <button
                    type="button"
                    onClick={() => setViewAllModal('subjects')}
                    className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    View All <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="py-2 font-medium w-6">#</th>
                        <th className="py-2 font-medium">Subject</th>
                        <th className="py-2 font-medium text-center">Accuracy</th>
                        <th className="py-2 font-medium text-center">Answers</th>
                        <th className="py-2 font-medium text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayWeakestSubjects.slice(0, 5).map((sub) => (
                        <tr
                          key={sub.name}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                        >
                          <td className="py-2.5 text-slate-400 font-semibold">{sub.rank}</td>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">
                            {sub.name}
                          </td>
                          <td className="py-2.5 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                sub.accuracy < 50
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
                                  : sub.accuracy < 60
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {sub.accuracy}%
                            </span>
                          </td>
                          <td className="py-2.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                            {sub.answers.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 text-right">
                            <Sparkline points={sub.points} color={sub.color} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 2: Weakest Topics */}
              <div className={card}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weakest Topics
                  </h2>
                  <button
                    type="button"
                    onClick={() => setViewAllModal('topics')}
                    className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    View All <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="py-2 font-medium w-6">#</th>
                        <th className="py-2 font-medium">Topic</th>
                        <th className="py-2 font-medium text-center">Accuracy</th>
                        <th className="py-2 font-medium text-center">Answers</th>
                        <th className="py-2 font-medium text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayWeakestTopics.slice(0, 5).map((top) => (
                        <tr
                          key={top.name}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                        >
                          <td className="py-2.5 text-slate-400 font-semibold">{top.rank}</td>
                          <td
                            className="py-2.5 font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px]"
                            title={top.name}
                          >
                            {top.name}
                          </td>
                          <td className="py-2.5 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                top.accuracy < 40
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
                                  : top.accuracy < 50
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {top.accuracy}%
                            </span>
                          </td>
                          <td className="py-2.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                            {top.answers.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 text-right">
                            <Sparkline points={top.points} color={top.color} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 3: Subject-wise Weak Students */}
              <div className={card}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Subject-wise Answers
                  </h2>
                  <a
                    href="/admin/students"
                    className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    View All <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="py-2 font-medium w-6">#</th>
                        <th className="py-2 font-medium">Subject</th>
                        <th className="py-2 font-medium text-center">Answers</th>
                        <th className="py-2 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayWeakestSubjects.slice(0, 5).map((sub) => (
                        <tr
                          key={sub.name}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                        >
                          <td className="py-2.5 text-slate-400 font-semibold">{sub.rank}</td>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">
                            {sub.name}
                          </td>
                          <td className="py-2.5 text-center font-bold text-slate-700 dark:text-slate-200">
                            {sub.answers.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWeakSubject({
                                  id: sub.id,
                                  name: sub.name,
                                  accuracy: sub.accuracy,
                                  answers: sub.answers,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 transition-colors cursor-pointer"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ==================================================================== */}
            {/* 7. PRACTICE PACK TARGETING & ACTIONABLE DELIVERY WORKFLOW            */}
            {/* ==================================================================== */}
            <section className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Topic Practice Pack Delivery
                  </h2>
                  <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-semibold border border-blue-100 dark:border-blue-900">
                    Targeting &amp; Delivery Workflow
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Dispatch personalized revision sets
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Send an in-app practice recommendation for a weak topic to active test takers, Pro
                members or all students.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Weak Topic
                  </label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full border rounded-xl p-2.5 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select a topic to target...</option>
                    {(data.questionInsights?.weakestTopics || []).map((t) => (
                      <option key={t.chapterId} value={t.chapterId}>
                        {t.chapterName} ({t.accuracyRate}% accuracy)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Student Cohort
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as 'all' | 'active' | 'pro')}
                    className="w-full border rounded-xl p-2.5 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="active">Active Test Takers (selected range)</option>
                    <option value="all">All Enrolled Students</option>
                    <option value="pro">Pro Members Only</option>
                  </select>
                </div>
              </div>

              {dispatchNotice && (
                <div
                  role={dispatchNotice.kind === 'error' ? 'alert' : 'status'}
                  className={
                    dispatchNotice.kind === 'error'
                      ? 'mb-3 p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200 text-xs font-medium border border-rose-200 dark:border-rose-800 flex items-center gap-2'
                      : 'mb-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-2'
                  }
                >
                  {dispatchNotice.kind === 'error' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{dispatchNotice.text}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">
                  {selectedTopicId
                    ? 'Topic selected. Ready to dispatch.'
                    : 'Select a topic to enable delivery.'}
                </span>
                <button
                  type="button"
                  disabled={!selectedTopicId || isDispatching}
                  onClick={handleDispatchPracticePack}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isDispatching ? 'Dispatching...' : 'Dispatch Topic Practice Pack'}
                </button>
              </div>
            </section>

            {/* ==================================================================== */}
            {/* 8. DEEP-DIVE PERFORMANCE INSPECTOR (STUDENT RANKINGS & WRONG Qs)     */}
            {/* ==================================================================== */}
            <section className={card}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Detailed Performance Inspector
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Deep dive into student leaderboard standings and the hardest questions across
                    mock series.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex items-center text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDeepDiveTab('rankings')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        deepDiveTab === 'rankings'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Student Rankings</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {data.studentRankings?.length || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeepDiveTab('wrongQuestions')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        deepDiveTab === 'wrongQuestions'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Most Wrong Questions</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {data.questionInsights?.mostWrongQuestions?.length || 0}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* TAB 1: Student Leaderboard / Rankings */}
              {deepDiveTab === 'rankings' && (
                <div className="pt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student by name or email..."
                        value={rankingsSearch}
                        onChange={(e) => setRankingsSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Showing {filteredStudentRankings.length} aspirants
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500">
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="py-2.5 px-3 font-semibold w-12 text-center">Rank</th>
                          <th className="py-2.5 px-3 font-semibold">Student Name</th>
                          <th className="py-2.5 px-3 font-semibold">Plan</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Tests Taken</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Accuracy</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Total Score</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredStudentRankings.length > 0 ? (
                          filteredStudentRankings.slice(0, 15).map((student) => (
                            <tr
                              key={student.userId}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                            >
                              <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                                {student.rank <= 3 ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px]">
                                    #{student.rank}
                                  </span>
                                ) : (
                                  `#${student.rank}`
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                                <div>{student.name}</div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {student.email}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                {student.isPro ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    PRO
                                  </span>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800">
                                    FREE
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                                {student.totalTests}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    student.accuracy < 50
                                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
                                      : student.accuracy < 70
                                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                                  }`}
                                >
                                  {student.accuracy}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                                {student.totalScore}
                              </td>
                              <td className="py-2.5 px-3 text-right text-[11px] text-slate-400">
                                {student.lastActive
                                  ? getKolkataDateString(new Date(student.lastActive))
                                  : 'N/A'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              No student rankings recorded for this reporting period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: Most Wrong Questions */}
              {deepDiveTab === 'wrongQuestions' && (
                <div className="pt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search question keyword, subject or topic..."
                        value={wrongQuestionsSearch}
                        onChange={(e) => setWrongQuestionsSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">
                        Showing {filteredWrongQuestions.length} challenging questions
                      </span>
                      <a
                        href="/admin/item-analysis"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        Full item analysis <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500">
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="py-2.5 px-3 font-semibold w-10 text-center">#</th>
                          <th className="py-2.5 px-3 font-semibold">Question Content</th>
                          <th className="py-2.5 px-3 font-semibold">Subject / Topic</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Difficulty</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Failure Rate</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Accuracy</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Attempts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredWrongQuestions.length > 0 ? (
                          filteredWrongQuestions.slice(0, 15).map((q, idx) => (
                            <tr
                              key={q.questionId}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                            >
                              <td className="py-2.5 px-3 text-center text-slate-400 font-bold">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 max-w-xs sm:max-w-md">
                                <p className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                                  {q.questionBengaliText || q.questionText}
                                </p>
                                {q.questionBengaliText && q.questionText && (
                                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                    {q.questionText}
                                  </p>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                                <span className="font-semibold">{q.subjectName}</span>
                                <div className="text-[10px] text-slate-400">{q.chapterName}</div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                                  {q.difficulty || 'medium'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                                {q.failureRate}%
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                  {q.accuracyRate}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                                {q.totalAttempts.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              No difficult question data recorded for this reporting period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* ==================================================================== */}
            {/* 9. MODALS: VIEW ALL (SUBJECTS, TOPICS, CATEGORIES, WEAK STUDENTS)     */}
            {/* ==================================================================== */}

            {/* Modal: View All Subjects */}
            {viewAllModal === 'subjects' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                <div className="bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        All Weakest Subjects
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Overview of student accuracy across all tested subjects.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewAllModal(null)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          <th className="py-2 font-medium w-8">#</th>
                          <th className="py-2 font-medium">Subject</th>
                          <th className="py-2 font-medium text-center">Accuracy</th>
                          <th className="py-2 font-medium text-center">Questions Attempted</th>
                          <th className="py-2 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {displayWeakestSubjects.map((sub) => (
                          <tr
                            key={sub.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                          >
                            <td className="py-2.5 text-slate-400 font-semibold">{sub.rank}</td>
                            <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">
                              {sub.name}
                            </td>
                            <td className="py-2.5 text-center">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                  sub.accuracy < 50
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                                    : sub.accuracy < 60
                                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
                                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {sub.accuracy}%
                              </span>
                            </td>
                            <td className="py-2.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                              {sub.answers.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewAllModal(null);
                                  setSelectedWeakSubject({
                                    id: sub.id,
                                    name: sub.name,
                                    accuracy: sub.accuracy,
                                    answers: sub.answers,
                                  });
                                }}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 cursor-pointer"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <a
                      href="/admin/subjects"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      Manage Subjects in Catalog <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setViewAllModal(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: View All Topics */}
            {viewAllModal === 'topics' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                <div className="bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        All Weakest Chapters &amp; Topics
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Low-scoring topics requiring revision practice packs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewAllModal(null)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          <th className="py-2 font-medium w-8">#</th>
                          <th className="py-2 font-medium">Topic Name</th>
                          <th className="py-2 font-medium">Subject</th>
                          <th className="py-2 font-medium text-center">Accuracy</th>
                          <th className="py-2 font-medium text-center">Questions Attempted</th>
                          <th className="py-2 font-medium text-right">Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {displayWeakestTopics.map((top) => (
                          <tr
                            key={top.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                          >
                            <td className="py-2.5 text-slate-400 font-semibold">{top.rank}</td>
                            <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">
                              {top.name}
                            </td>
                            <td className="py-2.5 text-slate-500 dark:text-slate-400">
                              {top.subjectName}
                            </td>
                            <td className="py-2.5 text-center">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                  top.accuracy < 40
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                                    : top.accuracy < 50
                                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
                                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {top.accuracy}%
                              </span>
                            </td>
                            <td className="py-2.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                              {top.answers.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTopicId(top.id);
                                  setViewAllModal(null);
                                }}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                              >
                                Select Topic
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <a
                      href="/admin/topics"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      Manage Topics in Catalog <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setViewAllModal(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: View All Exam Categories */}
            {/* Modal: Subject Weak Students Detail Inspector */}
            {selectedWeakSubject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                <div className="bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedWeakSubject.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
                          {selectedWeakSubject.accuracy}% Avg Accuracy
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Per-student subject accuracy is not reported. Listed below: students with
                        the lowest overall answer accuracy in the selected range.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedWeakSubject(null)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 overflow-y-auto">
                    {data.studentRankings && data.studentRankings.length > 0 ? (
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            <th className="py-2 font-medium w-8">Rank</th>
                            <th className="py-2 font-medium">Student Name</th>
                            <th className="py-2 font-medium text-center">Questions Attempted</th>
                            <th className="py-2 font-medium text-center">Accuracy</th>
                            <th className="py-2 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {[...data.studentRankings]
                            .filter((st) => st.questionsAttempted > 0)
                            .sort((a, b) => a.accuracy - b.accuracy)
                            .slice(0, 10)
                            .map((st) => (
                              <tr
                                key={st.userId}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                              >
                                <td className="py-2.5 text-slate-400 font-semibold">#{st.rank}</td>
                                <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">
                                  <div>{st.name}</div>
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    {st.email}
                                  </div>
                                </td>
                                <td className="py-2.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                                  {st.questionsAttempted}
                                </td>
                                <td className="py-2.5 text-center">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                                    {st.accuracy}%
                                  </span>
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const match =
                                        displayWeakestTopics.find(
                                          (t) => t.subjectName === selectedWeakSubject.name
                                        ) || displayWeakestTopics[0];
                                      if (match) setSelectedTopicId(match.id);
                                      setSelectedWeakSubject(null);
                                    }}
                                    className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Send className="w-3 h-3" /> Target
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No individual student attempts recorded in {selectedWeakSubject.name} for
                        this period.
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">
                      Answers recorded in subject:{' '}
                      {selectedWeakSubject.answers.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedWeakSubject(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </AdminDataBoundary>
    </div>
  );
};
