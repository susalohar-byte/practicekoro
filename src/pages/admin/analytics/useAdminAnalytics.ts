import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { analyticsRange } from '@/services/domains/admin.analytics';
import { getKolkataDateString } from '@/services/domains/admin.dashboard';
import type { DateRangePreset, PlatformAnalyticsData } from '@/types';
import { analyticsCsv } from './analyticsCsv';
import { generateSmoothPath } from './generateSmoothPath';

export function useAdminAnalytics() {
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

  return {
    preset,
    setPreset,
    start,
    setStart,
    end,
    setEnd,
    reload,
    setReload,
    data,
    setData,
    loadedPeriod,
    setLoadedPeriod,
    error,
    setError,
    loading,
    setLoading,
    selectedTopicId,
    setSelectedTopicId,
    targetAudience,
    setTargetAudience,
    isDispatching,
    setIsDispatching,
    dispatchNotice,
    setDispatchNotice,
    viewAllModal,
    setViewAllModal,
    selectedWeakSubject,
    setSelectedWeakSubject,
    deepDiveTab,
    setDeepDiveTab,
    rankingsSearch,
    setRankingsSearch,
    wrongQuestionsSearch,
    setWrongQuestionsSearch,
    handleDispatchPracticePack,
    range,
    period,
    download,
    card,
    totalStudentsCount,
    activeStudentsCount,
    newStudentsCount,
    testsAttemptedCount,
    questionsAnsweredCount,
    overallAccuracyVal,
    retainedRevenueVal,
    displayGenderStats,
    displayWeakestSubjects,
    displayWeakestTopics,
    demographicsData,
    growthChartData,
    filteredStudentRankings,
    filteredWrongQuestions,
  };
}

export type AdminAnalyticsState = ReturnType<typeof useAdminAnalytics>;
