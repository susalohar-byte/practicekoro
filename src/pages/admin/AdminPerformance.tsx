import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Users,
  FileText,
  Target,
  TrendingUp,
  Info,
  X,
  Check,
  Search,
  Download,
  AlertTriangle,
  Award,
  BookOpen,
  Layers,
  LayoutList,
  Eye,
  CheckCircle2,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { csvCell } from '@/utils/csvExport';
import type { DateRangePreset, PlatformAnalyticsData } from '@/types';
import { analyticsRange } from '@/services/domains/admin.analytics';

const RANGE_OPTIONS: { preset: DateRangePreset; label: string }[] = [
  { preset: 'today', label: 'Today' },
  { preset: 'yesterday', label: 'Yesterday' },
  { preset: 'last_7_days', label: 'Last 7 Days' },
  { preset: 'last_30_days', label: 'Last 30 Days' },
  { preset: 'this_month', label: 'This Month' },
  { preset: 'all_time', label: 'All Time' },
];

const formatKolkataDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface WrongQuestionItem {
  id: number | string;
  questionId?: string;
  questionText: string;
  questionTextBn?: string;
  subject: string;
  chapter?: string;
  difficulty?: string;
  subjectColor: string;
  wrongPercentage: number;
  totalAttempts: number;
  wrongCount?: number;
  accuracyRate?: number;
}

export interface TopicMetricItem {
  rank: number;
  topicId?: string;
  topic: string;
  subject: string;
  subjectBadgeColor: string;
  avgScore: number;
  attempts: number;
}

export interface SubjectMetricItem {
  rank: number;
  subjectId?: string;
  subject: string;
  avgScore: number;
  attempts: number;
  subjectColor: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AdminPerformance: React.FC = () => {
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
        tableSubjectFilter === 'All' || item.subject.toLowerCase() === tableSubjectFilter.toLowerCase();
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
        tableSubjectFilter === 'All' || item.subject.toLowerCase() === tableSubjectFilter.toLowerCase();
      const matchSearch =
        !q ||
        item.topic.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q);
      return matchSubject && matchSearch;
    });
  }, [weakestTopics, tableSearch, tableSubjectFilter]);

  const filteredTopTopics = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return topPerformingTopics.filter((item) => {
      const matchSubject =
        tableSubjectFilter === 'All' || item.subject.toLowerCase() === tableSubjectFilter.toLowerCase();
      const matchSearch =
        !q ||
        item.topic.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q);
      return matchSubject && matchSearch;
    });
  }, [topPerformingTopics, tableSearch, tableSubjectFilter]);

  const filteredSubjects = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return subjectMetrics.filter((item) => {
      const matchSubject =
        tableSubjectFilter === 'All' || item.subject.toLowerCase() === tableSubjectFilter.toLowerCase();
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
      const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
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
      const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
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
      const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
      downloadBlob(csv, `performance_top_topics_${Date.now()}.csv`);
    } else {
      const headers = ['Rank', 'Subject', 'Questions Attempted', 'Accuracy Rate (%)'];
      const rows = filteredSubjects.map((s) => [
        s.rank,
        s.subject,
        s.attempts,
        `${s.avgScore}%`,
      ]);
      const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
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

  // ============================================================================
  // TABLE RENDERERS
  // ============================================================================

  const renderWrongQuestionsTable = (data: WrongQuestionItem[]) => (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <tr>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center">
              #
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[280px]">
              Question Details
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[120px]">
              Subject
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[90px]">
              Attempts
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[140px]">
              Failure Rate
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[90px]">
              Accuracy
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-right w-20">
              Inspect
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-slate-400">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No frequently failed questions recorded in this range.
              </td>
            </tr>
          ) : (
            data.map((q) => (
              <tr
                key={q.id}
                className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                onClick={() => setSelectedQuestion(q)}
              >
                <td className="py-3 px-3.5 text-center">
                  <span
                    className={cn(
                      'w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-[11px] shadow-2xs',
                      Number(q.id) === 1 && 'bg-rose-600 text-white',
                      Number(q.id) === 2 && 'bg-rose-500 text-white',
                      Number(q.id) === 3 && 'bg-amber-500 text-white',
                      Number(q.id) > 3 && 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {q.id}
                  </span>
                </td>
                <td className="py-3 px-3.5">
                  <p className="font-bold text-[#0F172A] text-xs leading-snug group-hover:text-blue-600 transition-colors">
                    {q.questionText}
                  </p>
                  {q.questionTextBn && (
                    <p className="text-[11px] text-[#64748B] font-normal mt-0.5 line-clamp-1">
                      {q.questionTextBn}
                    </p>
                  )}
                  {q.chapter && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded mt-1">
                      <BookOpen className="w-2.5 h-2.5" />
                      {q.chapter}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block',
                      q.subjectColor
                    )}
                  >
                    {q.subject}
                  </span>
                </td>
                <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                  {q.totalAttempts.toLocaleString()}
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-rose-100 text-rose-700 text-[11px] font-black px-2 py-0.5 rounded-md">
                        {q.wrongPercentage}% wrong
                      </span>
                    </div>
                    <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, q.wrongPercentage)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="text-xs font-black text-emerald-600">
                    {q.accuracyRate ?? Math.max(0, 100 - q.wrongPercentage)}%
                  </span>
                </td>
                <td className="py-3 px-3.5 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuestion(q);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="View question details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderWeakTopicsTable = (data: TopicMetricItem[]) => (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <tr>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center">
              #
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[200px]">
              Topic / Chapter
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[130px]">
              Subject
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[110px]">
              Questions Answered
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[150px]">
              Average Accuracy
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-right min-w-[120px]">
              Priority Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No weak topic metrics recorded yet.
              </td>
            </tr>
          ) : (
            data.map((t) => {
              const isCritical = t.avgScore < 40;
              const isModerate = t.avgScore >= 40 && t.avgScore < 60;
              return (
                <tr key={t.rank} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3.5 text-center font-bold text-slate-500">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold',
                        t.rank <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {t.rank}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-bold text-[#0F172A]">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{t.topic}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block',
                        t.subjectBadgeColor
                      )}
                    >
                      {t.subject}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                    {t.attempts.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          'text-xs font-black px-2 py-0.5 rounded-md',
                          isCritical
                            ? 'bg-rose-100 text-rose-700'
                            : isModerate
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        )}
                      >
                        {t.avgScore}%
                      </span>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            isCritical ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.min(100, t.avgScore)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        isCritical
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isModerate
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                      )}
                    >
                      {isCritical ? 'Critical Attention' : isModerate ? 'Needs Practice' : 'Moderate'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderTopTopicsTable = (data: TopicMetricItem[]) => (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <tr>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center">
              #
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[200px]">
              Topic / Chapter
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[130px]">
              Subject
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[110px]">
              Questions Answered
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[150px]">
              Average Accuracy
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-right min-w-[120px]">
              Mastery Level
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400">
                <Award className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No top performing topics recorded yet.
              </td>
            </tr>
          ) : (
            data.map((t) => {
              const isMastered = t.avgScore >= 80;
              const isProficient = t.avgScore >= 65 && t.avgScore < 80;
              return (
                <tr key={t.rank} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3.5 text-center">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold shadow-2xs',
                        t.rank === 1 && 'bg-amber-400 text-amber-950 font-black',
                        t.rank === 2 && 'bg-slate-300 text-slate-800 font-bold',
                        t.rank === 3 && 'bg-amber-700/80 text-white font-bold',
                        t.rank > 3 && 'bg-emerald-100 text-emerald-800'
                      )}
                    >
                      {t.rank}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-bold text-[#0F172A]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{t.topic}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block',
                        t.subjectBadgeColor
                      )}
                    >
                      {t.subject}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                    {t.attempts.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-md">
                        {t.avgScore}%
                      </span>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, t.avgScore)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        isMastered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isProficient
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                      )}
                    >
                      {isMastered ? 'Mastered' : isProficient ? 'High Proficiency' : 'Good Competency'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderSubjectTable = (data: SubjectMetricItem[]) => (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <tr>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center">
              #
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[200px]">
              Subject
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[120px]">
              Questions Attempted
            </th>
            <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[160px]">
              Average Accuracy
            </th>
            <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-right min-w-[130px]">
              Performance Level
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-slate-400">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No subject metrics recorded yet.
              </td>
            </tr>
          ) : (
            data.map((s) => {
              const isStrong = s.avgScore >= 70;
              const isModerate = s.avgScore >= 50 && s.avgScore < 70;
              return (
                <tr key={s.rank} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3.5 text-center font-bold text-slate-500">
                    <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-700">
                      {s.rank}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-bold text-[#0F172A]">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2.5 h-2.5 rounded-full', s.subjectColor.split(' ')[0])} />
                      <span className="text-xs">{s.subject}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                    {s.attempts.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          'text-xs font-black px-2 py-0.5 rounded-md',
                          isStrong
                            ? 'bg-emerald-100 text-emerald-700'
                            : isModerate
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-rose-100 text-rose-700'
                        )}
                      >
                        {s.avgScore}%
                      </span>
                      <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            isStrong ? 'bg-emerald-500' : isModerate ? 'bg-blue-500' : 'bg-rose-500'
                          )}
                          style={{ width: `${Math.min(100, s.avgScore)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        isStrong
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isModerate
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                      )}
                    >
                      {isStrong ? 'Above Benchmark' : isModerate ? 'Standard' : 'Below Benchmark'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-4 pb-12 animate-in fade-in duration-300 font-sans">
      {/* ==================================================================== */}
      {/* 1. HEADER & DATE PICKER */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Performance</h1>
          <p className="text-xs font-normal text-[#64748B] mt-0.5">
            Analyze student performance, identify strengths and weaknesses, and track progress
            across exams, subjects and topics.
          </p>
        </div>

        {/* Date Range Picker Pill with calendar icon on the right */}
        <button
          onClick={() => setIsDateModalOpen(true)}
          className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1E293B] shadow-2xs flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>{dateRangeLabel}</span>
          <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
        </button>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-2xl p-4 border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between"
        >
          <div>
            <span className="font-bold mr-1">Performance data unavailable:</span> {loadError}
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. SUMMARY METRIC CARDS (4 CARDS IN A ROW) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Total Students</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {totalStudents.toLocaleString()}
              </span>
              {totalStudents > 0 && (
                <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Registered Aspirants</p>
          </div>
        </div>

        {/* Card 2: Tests Attempted */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Tests Attempted</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {testsAttempted.toLocaleString()}
              </span>
              {testsAttempted > 0 && (
                <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Attempts started in range</p>
          </div>
        </div>

        {/* Card 3: Questions Answered */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Questions Answered</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {questionsAnswered.toLocaleString()}
              </span>
              {questionsAnswered > 0 && (
                <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Total Questions</p>
          </div>
        </div>

        {/* Card 4: Overall Accuracy */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Overall Accuracy</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {overallAccuracy}%
              </span>
              {overallAccuracy > 0 && (
                <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Platform Average</p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. ROW 2: CHARTS ROW (Trend on Left + Subject-wise on Right) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT CHART: Performance Trend (~60% / 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-[#0F172A]">Performance Trend</h3>
              <Info className="w-3 h-3 text-[#94A3B8]" />
            </div>

            <div className="flex items-center gap-3 text-[10px] font-semibold text-[#475569]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span>Tests Attempted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Answer Accuracy (%)</span>
              </div>
            </div>
          </div>

          {trend.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
              No attempts recorded in this range.
            </div>
          ) : (
            <div className="relative h-[220px] w-full pt-4">
              <svg viewBox="0 0 540 180" className="w-full h-full overflow-visible">
                {[20, 55, 90, 125].map((y) => (
                  <line
                    key={y}
                    x1="30"
                    y1={y}
                    x2="510"
                    y2={y}
                    stroke="#F1F5F9"
                    strokeDasharray="3 3"
                  />
                ))}
                <line x1="30" y1="160" x2="510" y2="160" stroke="#E2E8F0" />
                <text x="5" y="24" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">
                  {maxTrendAttempts.toLocaleString()}
                </text>
                <text x="20" y="163" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">
                  0
                </text>
                <text x="515" y="24" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">
                  100%
                </text>
                <text x="515" y="163" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">
                  0%
                </text>
                <path
                  d={trendPath('averageAccuracy', 100)}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={trendPath('attemptsCount', maxTrendAttempts)}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {trend.map((t, i) => {
                  const acc = trendPoint(i, t.averageAccuracy, 100);
                  const att = trendPoint(i, t.attemptsCount, maxTrendAttempts);
                  return (
                    <g key={t.date}>
                      <circle cx={acc.x} cy={acc.y} r="3" fill="#10B981">
                        <title>{`${t.label}: ${t.averageAccuracy}% accuracy`}</title>
                      </circle>
                      <circle cx={att.x} cy={att.y} r="3" fill="#2563EB">
                        <title>{`${t.label}: ${t.attemptsCount} attempts`}</title>
                      </circle>
                    </g>
                  );
                })}
              </svg>

              <div className="flex justify-between pl-8 pr-8 text-[9px] font-semibold text-[#94A3B8] -mt-1">
                {trend.map((t) => (
                  <span key={t.date}>{t.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT CHART: Subject-wise Accuracy (~40% / 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold text-[#0F172A]">Subject-wise Accuracy</h3>
          </div>

          <div className="relative h-[220px] w-full flex items-end pt-4 pb-2">
            <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">
              100%
            </div>
            <div className="absolute inset-x-0 top-16 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">
              80%
            </div>
            <div className="absolute inset-x-0 top-26 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">
              60%
            </div>
            <div className="absolute inset-x-0 top-36 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">
              40%
            </div>
            <div className="absolute inset-x-0 top-46 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">
              20%
            </div>
            <div className="absolute inset-x-0 bottom-6 border-b border-slate-200 flex items-center justify-start text-[8px] text-slate-400">
              0%
            </div>

            <div className="w-full h-full flex items-end justify-around pl-5 pr-1 z-10 pb-6">
              {subjectBars.length === 0 && (
                <p className="self-center text-xs text-slate-400">
                  No answered questions in this range.
                </p>
              )}
              {subjectBars.map((bar) => (
                <div key={bar.name} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-800 mb-1 group-hover:scale-110 transition-transform">
                    {bar.score}%
                  </span>
                  <div
                    className={cn(
                      'w-7 sm:w-8 rounded-t-lg transition-all hover:brightness-105',
                      bar.color
                    )}
                    style={{ height: `${(bar.score / 100) * 140}px` }}
                  />
                  <span className="text-[9px] font-semibold text-slate-600 mt-2 text-center w-12 truncate leading-tight">
                    {bar.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. PERFORMANCE DIAGNOSTICS & ANALYTICS TABLES (TABLE VIEW) */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {/* Table Master Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                Performance Diagnostics & Item Breakdown
              </h2>
              <span className="bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                Table View
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Tabular view of most frequently failed questions, weak topics, top performing topics,
              and subject accuracy.
            </p>
          </div>

          {/* Master View Controls (View Mode Toggle & Export) */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* View Mode Toggle: Tabbed vs All Tables */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('tabbed')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                  viewMode === 'tabbed'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
                title="Focused Tab View"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Tabbed</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                  viewMode === 'all'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
                title="All 4 Tables View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Tables</span>
              </button>
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#1E293B] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Bar (in Tabbed View Mode) */}
        {viewMode === 'tabbed' && (
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E2E8F0] px-4 pt-3 pb-0 bg-slate-50/70">
            <button
              type="button"
              onClick={() => setActiveTableTab('wrong_questions')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2',
                activeTableTab === 'wrong_questions'
                  ? 'bg-white text-rose-700 border-rose-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Most Wrong Questions</span>
              <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {wrongQuestions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('weak_topics')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2',
                activeTableTab === 'weak_topics'
                  ? 'bg-white text-amber-700 border-amber-500 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
              )}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>Weak Topics</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {weakestTopics.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('top_topics')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2',
                activeTableTab === 'top_topics'
                  ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
              )}
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Top Performing Topics</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {topPerformingTopics.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('subjects')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2',
                activeTableTab === 'subjects'
                  ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
              )}
            >
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Subject Performance</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {subjectMetrics.length}
              </span>
            </button>
          </div>
        )}

        {/* Search & Subject Filter Bar */}
        <div className="p-3.5 bg-white border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search questions, topics, or subjects..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 bg-slate-50/50"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => setTableSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Subject:</span>
            </div>
            <div className="relative">
              <select
                value={tableSubjectFilter}
                onChange={(e) => setTableSubjectFilter(e.target.value)}
                className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 pr-8 appearance-none focus:outline-none focus:border-blue-500"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Subjects' : s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {(tableSearch || tableSubjectFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setTableSearch('');
                  setTableSubjectFilter('All');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline px-1.5 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Render Content */}
        {viewMode === 'tabbed' ? (
          <div>
            {activeTableTab === 'wrong_questions' && renderWrongQuestionsTable(filteredWrongQuestions)}
            {activeTableTab === 'weak_topics' && renderWeakTopicsTable(filteredWeakTopics)}
            {activeTableTab === 'top_topics' && renderTopTopicsTable(filteredTopTopics)}
            {activeTableTab === 'subjects' && renderSubjectTable(filteredSubjects)}
          </div>
        ) : (
          /* Stacked View: All 4 Tables Rendered */
          <div className="divide-y divide-[#E2E8F0]">
            {/* Table 1: Most Wrong Questions */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A]">Most Wrong Questions</h3>
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {filteredWrongQuestions.length} Questions
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
                {renderWrongQuestionsTable(filteredWrongQuestions)}
              </div>
            </div>

            {/* Table 2: Weak Topics */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A]">Weak Topics (Needs Practice)</h3>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {filteredWeakTopics.length} Topics
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
                {renderWeakTopicsTable(filteredWeakTopics)}
              </div>
            </div>

            {/* Table 3: Top Performing Topics */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A]">Top Performing Topics</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {filteredTopTopics.length} Topics
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
                {renderTopTopicsTable(filteredTopTopics)}
              </div>
            </div>

            {/* Table 4: Subject Performance */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A]">Subject-wise Accuracy & Volume</h3>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {filteredSubjects.length} Subjects
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
                {renderSubjectTable(filteredSubjects)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 5. MODAL: DATE RANGE PICKER */}
      {/* ==================================================================== */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Select Date Range</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {RANGE_OPTIONS.map((range) => (
                <button
                  key={range.preset}
                  type="button"
                  onClick={() => {
                    setRangePreset(range.preset);
                    setIsDateModalOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-xl border font-semibold transition-colors flex items-center justify-between cursor-pointer',
                    rangePreset === range.preset
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>{range.label}</span>
                  {rangePreset === range.preset && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDateModalOpen(false)}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. MODAL: QUESTION INSPECTION MODAL */}
      {/* ==================================================================== */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center">
                  #{selectedQuestion.id}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">Question Inspection</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    selectedQuestion.subjectColor
                  )}
                >
                  {selectedQuestion.subject}
                </span>
                {selectedQuestion.chapter && (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {selectedQuestion.chapter}
                  </span>
                )}
                {selectedQuestion.difficulty && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full capitalize">
                    {selectedQuestion.difficulty}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <p className="font-extrabold text-slate-900 text-sm leading-relaxed">
                  {selectedQuestion.questionText}
                </p>
                {selectedQuestion.questionTextBn && (
                  <p className="text-xs text-slate-700 pt-1 border-t border-slate-200/60 leading-relaxed font-normal">
                    {selectedQuestion.questionTextBn}
                  </p>
                )}
              </div>

              {/* Performance Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Total Attempts</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {selectedQuestion.totalAttempts.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-rose-600 uppercase">Wrong Answers</p>
                  <p className="text-base font-black text-rose-700 mt-0.5">
                    {selectedQuestion.wrongCount?.toLocaleString() ??
                      Math.round(
                        (selectedQuestion.totalAttempts * selectedQuestion.wrongPercentage) / 100
                      ).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-rose-600 uppercase">Failure Rate</p>
                  <p className="text-base font-black text-rose-700 mt-0.5">
                    {selectedQuestion.wrongPercentage}%
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase">Accuracy Rate</p>
                  <p className="text-base font-black text-emerald-700 mt-0.5">
                    {selectedQuestion.accuracyRate ??
                      Math.max(0, 100 - selectedQuestion.wrongPercentage)}
                    %
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    { label: 'Loading performance…', variant: 'dashboard' }
  );
};
