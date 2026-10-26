import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { csvCell } from '@/utils/csvExport';
import type { DateRangePreset, PlatformAnalyticsData } from '@/types';
import { analyticsRange } from '@/services/domains/admin.analytics';
import {
  type SubjectMetricItem,
  type TopicMetricItem,
  type WrongQuestionItem,
  formatKolkataDay,
} from './performanceUtils';

export function useAdminPerformance() {
  const [pageLoading, setPageLoading] = useState(true);

  // Live Database State
  const [analyticsData, setAnalyticsData] = useState<PlatformAnalyticsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [rangePreset, setRangePreset] = useState<DateRangePreset>('this_month');

  // Table View States
  const [activeTableTab, setActiveTableTab] = useState<
    'wrong_questions' | 'weak_topics' | 'top_topics' | 'subjects'
  >('wrong_questions');
  const [viewMode, setViewMode] = useState<'tabbed' | 'all'>('tabbed');
  const [tableSearch, setTableSearch] = useState('');
  const [tableSubjectFilter, setTableSubjectFilter] = useState('All');
  const [selectedQuestion, setSelectedQuestion] = useState<WrongQuestionItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setPageLoading(true);
      setLoadError(null);
      try {
        const overview = await api.getPlatformAnalyticsOverview(rangePreset);
        if (isMounted) setAnalyticsData(overview);
      } catch (err) {
        console.warn('Failed to load performance analytics:', err);
        if (isMounted) {
          setAnalyticsData(null);
          setLoadError(err instanceof Error ? err.message : 'Failed to load performance data.');
        }
      } finally {
        if (isMounted) setPageLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [rangePreset, reloadKey]);

  // Date range modal (label derived from the real Kolkata-day bounds of the loaded range)
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const dateRangeLabel = useMemo(() => {
    if (rangePreset === 'all_time') return 'All Time';
    const b = analyticsRange(rangePreset);
    return `${formatKolkataDay(b.startIso)} → ${formatKolkataDay(b.endIso)}`;
  }, [rangePreset]);

  // Computed live metrics
  const totalStudents = analyticsData?.studentPerformance?.totalStudents ?? 0;
  const testsAttempted = analyticsData?.studentPerformance?.testsAttempted ?? 0;
  const questionsAnswered = analyticsData?.studentPerformance?.questionsAnswered ?? 0;
  const overallAccuracy = analyticsData?.studentPerformance?.overallAccuracy ?? 0;

  // 1. Most wrong questions from live analytics
  const wrongQuestions: WrongQuestionItem[] = useMemo(() => {
    const raw = analyticsData?.questionInsights?.mostWrongQuestions || [];
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-cyan-50 text-cyan-700 border-cyan-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-sky-50 text-sky-700 border-sky-200',
    ];
    return raw.map((q, idx) => ({
      id: idx + 1,
      questionId: q.questionId,
      questionText: q.questionText,
      questionTextBn: q.questionBengaliText,
      subject: q.subjectName,
      chapter: q.chapterName,
      difficulty: q.difficulty,
      subjectColor: colors[idx % colors.length],
      wrongPercentage: Math.round(q.failureRate),
      wrongCount: q.wrongCount,
      accuracyRate: Math.round(q.accuracyRate),
      totalAttempts: q.totalAttempts,
    }));
  }, [analyticsData]);

  // 2. Weakest topics (sorted ascending by accuracy)
  const weakestTopics: TopicMetricItem[] = useMemo(() => {
    const raw = analyticsData?.questionInsights?.weakestTopics || [];
    const badgeColors = [
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-cyan-50 text-cyan-700 border-cyan-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200',
    ];
    const sorted = [...raw].sort((a, b) => a.accuracyRate - b.accuracyRate);
    return sorted.map((t, idx) => ({
      rank: idx + 1,
      topicId: t.chapterId,
      topic: t.chapterName,
      subject: t.subjectName,
      subjectBadgeColor: badgeColors[idx % badgeColors.length],
      avgScore: Math.round(t.accuracyRate),
      attempts: t.totalQuestionsAttempted,
    }));
  }, [analyticsData]);

  // 3. Top performing topics (sorted descending by accuracy)
  const topPerformingTopics: TopicMetricItem[] = useMemo(() => {
    const raw = analyticsData?.questionInsights?.weakestTopics || [];
    const badgeColors = [
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-teal-50 text-teal-700 border-teal-200',
      'bg-cyan-50 text-cyan-700 border-cyan-200',
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-purple-50 text-purple-700 border-purple-200',
    ];
    const sorted = [...raw].sort((a, b) => b.accuracyRate - a.accuracyRate);
    return sorted.map((t, idx) => ({
      rank: idx + 1,
      topicId: t.chapterId,
      topic: t.chapterName,
      subject: t.subjectName,
      subjectBadgeColor: badgeColors[idx % badgeColors.length],
      avgScore: Math.round(t.accuracyRate),
      attempts: t.totalQuestionsAttempted,
    }));
  }, [analyticsData]);

  // 4. Subject metrics from live analytics
  const subjectMetrics: SubjectMetricItem[] = useMemo(() => {
    const raw = analyticsData?.questionInsights?.weakestSubjects || [];
    const badgeColors = [
      'bg-sky-50 text-sky-700 border-sky-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-teal-50 text-teal-700 border-teal-200',
    ];
    const sorted = [...raw].sort((a, b) => b.totalQuestionsAttempted - a.totalQuestionsAttempted);
    return sorted.map((s, idx) => ({
      rank: idx + 1,
      subjectId: s.subjectId,
      subject: s.subjectName,
      avgScore: Math.round(s.accuracyRate),
      attempts: s.totalQuestionsAttempted,
      subjectColor: badgeColors[idx % badgeColors.length],
    }));
  }, [analyticsData]);

  // Available subjects for filtering
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    wrongQuestions.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    weakestTopics.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    topPerformingTopics.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    subjectMetrics.forEach((s) => {
      if (s.subject) set.add(s.subject);
    });
    return ['All', ...Array.from(set).sort()];
  }, [wrongQuestions, weakestTopics, topPerformingTopics, subjectMetrics]);

  // Filtered lists based on search and subject filter
  const filteredWrongQuestions = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return wrongQuestions.filter((item) => {
      const matchSubject =
        tableSubjectFilter === 'All' ||
        item.subject.toLowerCase() === tableSubjectFilter.toLowerCase();
      const matchSearch =
        !q ||
        item.questionText.toLowerCase().includes(q) ||
        (item.questionTextBn && item.questionTextBn.toLowerCase().includes(q)) ||
        item.subject.toLowerCase().includes(q) ||
        (item.chapter && item.chapter.toLowerCase().includes(q));
      return matchSubject && matchSearch;
    });
  }, [wrongQuestions, tableSearch, tableSubjectFilter]);

  const filteredWeakTopics = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return weakestTopics.filter((item) => {
      const matchSubject =
        tableSubjectFilter === 'All' ||
        item.subject.toLowerCase() === tableSubjectFilter.toLowerCase();
      const matchSearch =
        !q || item.topic.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q);
      return matchSubject && matchSearch;
    });
  }, [weakestTopics, tableSearch, tableSubjectFilter]);

  const filteredTopTopics = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return topPerformingTopics.filter((item) => {
      const matchSubject =
        tableSubjectFilter === 'All' ||
        item.subject.toLowerCase() === tableSubjectFilter.toLowerCase();
      const matchSearch =
        !q || item.topic.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q);
      return matchSubject && matchSearch;
    });
  }, [topPerformingTopics, tableSearch, tableSubjectFilter]);

  const filteredSubjects = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return subjectMetrics.filter((item) => {
      const matchSubject =
        tableSubjectFilter === 'All' ||
        item.subject.toLowerCase() === tableSubjectFilter.toLowerCase();
      const matchSearch = !q || item.subject.toLowerCase().includes(q);
      return matchSubject && matchSearch;
    });
  }, [subjectMetrics, tableSearch, tableSubjectFilter]);

  // CSV Exporter
  const handleExportCsv = () => {
    const downloadBlob = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    if (activeTableTab === 'wrong_questions') {
      const headers = [
        '#',
        'Question (EN)',
        'Question (BN)',
        'Subject',
        'Chapter',
        'Total Attempts',
        'Wrong Answers',
        'Failure Rate (%)',
        'Accuracy Rate (%)',
      ];
      const rows = filteredWrongQuestions.map((q) => [
        q.id,
        q.questionText,
        q.questionTextBn || '',
        q.subject,
        q.chapter || '',
        q.totalAttempts,
        q.wrongCount ?? Math.round((q.totalAttempts * q.wrongPercentage) / 100),
        `${q.wrongPercentage}%`,
        `${q.accuracyRate ?? 100 - q.wrongPercentage}%`,
      ]);
      const csv =
        '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
      downloadBlob(csv, `performance_wrong_questions_${Date.now()}.csv`);
    } else if (activeTableTab === 'weak_topics') {
      const headers = ['Rank', 'Topic', 'Subject', 'Questions Attempted', 'Accuracy Rate (%)'];
      const rows = filteredWeakTopics.map((t) => [
        t.rank,
        t.topic,
        t.subject,
        t.attempts,
        `${t.avgScore}%`,
      ]);
      const csv =
        '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
      downloadBlob(csv, `performance_weak_topics_${Date.now()}.csv`);
    } else if (activeTableTab === 'top_topics') {
      const headers = ['Rank', 'Topic', 'Subject', 'Questions Attempted', 'Accuracy Rate (%)'];
      const rows = filteredTopTopics.map((t) => [
        t.rank,
        t.topic,
        t.subject,
        t.attempts,
        `${t.avgScore}%`,
      ]);
      const csv =
        '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
      downloadBlob(csv, `performance_top_topics_${Date.now()}.csv`);
    } else {
      const headers = ['Rank', 'Subject', 'Questions Attempted', 'Accuracy Rate (%)'];
      const rows = filteredSubjects.map((s) => [s.rank, s.subject, s.attempts, `${s.avgScore}%`]);
      const csv =
        '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
      downloadBlob(csv, `performance_subjects_${Date.now()}.csv`);
    }
  };

  // Subject data with vertical bars
  const subjectBars = useMemo(() => {
    const subs = analyticsData?.questionInsights?.weakestSubjects || [];
    const colors = [
      'bg-sky-500',
      'bg-emerald-500',
      'bg-amber-400',
      'bg-purple-500',
      'bg-pink-400',
      'bg-teal-500',
    ];
    return subs.slice(0, 6).map((bar, idx) => ({
      name: bar.subjectName,
      score: Math.round(bar.accuracyRate),
      color: colors[idx % colors.length],
    }));
  }, [analyticsData]);

  // Performance trend from real range buckets (attempts and answer accuracy)
  const trend = analyticsData?.studentPerformance?.performanceTrend || [];
  const maxTrendAttempts = Math.max(0, ...trend.map((t) => t.attemptsCount));
  const trendPoint = (i: number, value: number, max: number) => ({
    x: trend.length > 1 ? 35 + (i * 470) / (trend.length - 1) : 270,
    y: max > 0 ? 160 - (value / max) * 140 : 160,
  });
  const trendPath = (key: 'attemptsCount' | 'averageAccuracy', max: number) =>
    trend
      .map((t, i) => {
        const { x, y } = trendPoint(i, t[key], max);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

  return {
    pageLoading,
    loadError,
    setReloadKey,
    rangePreset,
    setRangePreset,
    activeTableTab,
    setActiveTableTab,
    viewMode,
    setViewMode,
    tableSearch,
    setTableSearch,
    tableSubjectFilter,
    setTableSubjectFilter,
    selectedQuestion,
    setSelectedQuestion,
    isDateModalOpen,
    setIsDateModalOpen,
    dateRangeLabel,
    totalStudents,
    testsAttempted,
    questionsAnswered,
    overallAccuracy,
    wrongQuestions,
    weakestTopics,
    topPerformingTopics,
    subjectMetrics,
    availableSubjects,
    filteredWrongQuestions,
    filteredWeakTopics,
    filteredTopTopics,
    filteredSubjects,
    handleExportCsv,
    subjectBars,
    trend,
    maxTrendAttempts,
    trendPoint,
    trendPath,
  };
}

export type AdminPerformanceState = ReturnType<typeof useAdminPerformance>;
