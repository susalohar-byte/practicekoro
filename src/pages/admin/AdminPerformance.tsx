import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Users, FileText, Target, TrendingUp, Info, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
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
  questionText: string;
  questionTextBn?: string;
  subject: string;
  subjectColor: string;
  wrongPercentage: number;
  totalAttempts: number;
}

export interface TopicMetricItem {
  rank: number;
  topic: string;
  subject: string;
  subjectBadgeColor: string;
  avgScore: number;
  attempts: number;
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

  // Modals
  const [isWrongQuestionsModalOpen, setIsWrongQuestionsModalOpen] = useState(false);
  const [isWeakestTopicsModalOpen, setIsWeakestTopicsModalOpen] = useState(false);
  const [isTopTopicsModalOpen, setIsTopTopicsModalOpen] = useState(false);

  // Computed live metrics
  const totalStudents = analyticsData?.studentPerformance?.totalStudents ?? 0;
  const testsAttempted = analyticsData?.studentPerformance?.testsAttempted ?? 0;
  const questionsAnswered = analyticsData?.studentPerformance?.questionsAnswered ?? 0;
  const overallAccuracy = analyticsData?.studentPerformance?.overallAccuracy ?? 0;

  // Most wrong questions from live analytics
  const wrongQuestions: WrongQuestionItem[] = useMemo(() => {
    const raw = analyticsData?.questionInsights?.mostWrongQuestions || [];
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-cyan-50 text-cyan-700 border-cyan-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-sky-50 text-sky-700 border-sky-200',
    ];
    return raw.slice(0, 5).map((q, idx) => ({
      id: idx + 1,
      questionText: q.questionText,
      questionTextBn: q.questionBengaliText,
      subject: q.subjectName,
      subjectColor: colors[idx % colors.length],
      wrongPercentage: Math.round(q.failureRate),
      totalAttempts: q.totalAttempts,
    }));
  }, [analyticsData]);

  // Weakest topics from live analytics
  const weakestTopics: TopicMetricItem[] = useMemo(() => {
    const raw = analyticsData?.questionInsights?.weakestTopics || [];
    const badgeColors = [
      'bg-amber-50 text-amber-700',
      'bg-cyan-50 text-cyan-700',
      'bg-emerald-50 text-emerald-700',
      'bg-purple-50 text-purple-700',
      'bg-indigo-50 text-indigo-700',
    ];
    return raw.slice(0, 5).map((t, idx) => ({
      rank: idx + 1,
      topic: t.chapterName,
      subject: t.subjectName,
      subjectBadgeColor: badgeColors[idx % badgeColors.length],
      avgScore: Math.round(t.accuracyRate),
      attempts: t.totalQuestionsAttempted,
    }));
  }, [analyticsData]);

  // Top performing topics from live analytics
  const topPerformingTopics: TopicMetricItem[] = useMemo(() => {
    const raw = [...(analyticsData?.questionInsights?.weakestTopics || [])].reverse();
    const badgeColors = [
      'bg-cyan-50 text-cyan-700',
      'bg-emerald-50 text-emerald-700',
      'bg-amber-50 text-amber-700',
      'bg-purple-50 text-purple-700',
      'bg-rose-50 text-rose-700',
    ];
    return raw.slice(0, 5).map((t, idx) => ({
      rank: idx + 1,
      topic: t.chapterName,
      subject: t.subjectName,
      subjectBadgeColor: badgeColors[idx % badgeColors.length],
      avgScore: Math.round(t.accuracyRate),
      attempts: t.totalQuestionsAttempted,
    }));
  }, [analyticsData]);

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-[#0F172A]">Performance Trend</h3>
              <Info className="w-3 h-3 text-[#94A3B8]" />
            </div>

            {/* Legends */}
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

          {/* SVG Line Graph from real range buckets */}
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

              {/* X Axis Labels */}
              <div className="flex justify-between pl-8 pr-8 text-[9px] font-semibold text-[#94A3B8] -mt-1">
                {trend.map((t) => (
                  <span key={t.date}>{t.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT CHART: Subject-wise Performance (~40% / 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold text-[#0F172A]">Subject-wise Accuracy</h3>
          </div>

          {/* Bar Chart Container */}
          <div className="relative h-[220px] w-full flex items-end pt-4 pb-2">
            {/* Y Axis Guide lines */}
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

            {/* Vertical Bars */}
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
      {/* 4. ROW 3: 3 TOPIC DIAGNOSTIC CARDS (3 Equal Columns) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Most Wrong Questions */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-[#0F172A]">Most Wrong Questions</h3>
            <button
              onClick={() => setIsWrongQuestionsModalOpen(true)}
              className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {wrongQuestions.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No frequently failed questions recorded yet.
              </div>
            ) : (
              wrongQuestions.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0',
                        Number(q.id) === 1 && 'bg-rose-100 text-rose-600',
                        Number(q.id) === 2 && 'bg-blue-100 text-blue-600',
                        Number(q.id) === 3 && 'bg-amber-100 text-amber-600',
                        Number(q.id) > 3 && 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {q.id}
                    </span>
                    <p className="font-semibold text-slate-800 text-[11px] truncate">
                      {q.questionTextBn || q.questionText}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded border',
                        q.subjectColor
                      )}
                    >
                      {q.subject}
                    </span>
                    <div className="text-right leading-none">
                      <p className="text-[10px] font-black text-rose-600">{q.wrongPercentage}%</p>
                      <p className="text-[8px] text-rose-400">wrong</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Weakest Topics */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-[#0F172A]">Weakest Topics</h3>
            <button
              onClick={() => setIsWeakestTopicsModalOpen(true)}
              className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="pb-1 font-bold w-5">#</th>
                  <th className="pb-1 font-bold">Topic</th>
                  <th className="pb-1 font-bold">Subject</th>
                  <th className="pb-1 font-bold text-right">Avg. Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {weakestTopics.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                      No weak topic metrics recorded yet.
                    </td>
                  </tr>
                ) : (
                  weakestTopics.map((t) => (
                    <tr key={t.rank} className="text-[11px]">
                      <td className="py-2 font-bold text-slate-500">{t.rank}</td>
                      <td className="py-2 font-semibold text-slate-800 truncate max-w-[140px]">
                        {t.topic}
                      </td>
                      <td className="py-2">
                        <span
                          className={cn(
                            'text-[9px] font-bold px-1.5 py-0.5 rounded',
                            t.subjectBadgeColor
                          )}
                        >
                          {t.subject}
                        </span>
                      </td>
                      <td className="py-2 text-right font-black text-rose-600">{t.avgScore}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Top Performing Topics */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-[#0F172A]">Top Performing Topics</h3>
            <button
              onClick={() => setIsTopTopicsModalOpen(true)}
              className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="pb-1 font-bold w-5">#</th>
                  <th className="pb-1 font-bold">Topic</th>
                  <th className="pb-1 font-bold">Subject</th>
                  <th className="pb-1 font-bold text-right">Avg. Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topPerformingTopics.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                      No top performing topics recorded yet.
                    </td>
                  </tr>
                ) : (
                  topPerformingTopics.map((t) => (
                    <tr key={t.rank} className="text-[11px]">
                      <td className="py-2 font-bold text-slate-500">{t.rank}</td>
                      <td className="py-2 font-semibold text-slate-800 truncate max-w-[140px]">
                        {t.topic}
                      </td>
                      <td className="py-2">
                        <span
                          className={cn(
                            'text-[9px] font-bold px-1.5 py-0.5 rounded',
                            t.subjectBadgeColor
                          )}
                        >
                          {t.subject}
                        </span>
                      </td>
                      <td className="py-2 text-right font-black text-emerald-600">{t.avgScore}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. MODAL: DATE RANGE PICKER */}
      {/* ==================================================================== */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Select Date Range</h3>
              </div>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {RANGE_OPTIONS.map((range) => (
                <button
                  key={range.preset}
                  onClick={() => {
                    setRangePreset(range.preset);
                    setIsDateModalOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-xl border font-semibold transition-colors flex items-center justify-between',
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
                onClick={() => setIsDateModalOpen(false)}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. MODAL: MOST WRONG QUESTIONS DETAILS */}
      {/* ==================================================================== */}
      {isWrongQuestionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-extrabold text-slate-900">
                Most Frequently Failed Questions
              </h3>
              <button
                onClick={() => setIsWrongQuestionsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {wrongQuestions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No frequently failed questions recorded yet.
                </div>
              ) : (
                wrongQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Question #{q.id} • {q.subject}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                          {q.questionText}
                        </h4>
                        {q.questionTextBn && (
                          <p className="text-xs text-slate-600 mt-0.5">{q.questionTextBn}</p>
                        )}
                      </div>
                      <span className="bg-rose-100 text-rose-800 text-xs font-black px-2 py-0.5 rounded-full shrink-0">
                        {q.wrongPercentage}% Failed
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsWrongQuestionsModalOpen(false)}
                className="bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. MODAL: WEAKEST TOPICS */}
      {/* ==================================================================== */}
      {isWeakestTopicsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Weakest Topics Breakdown</h3>
              <button
                onClick={() => setIsWeakestTopicsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {weakestTopics.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No weak topic metrics recorded yet.
                </div>
              ) : (
                weakestTopics.map((t) => (
                  <div
                    key={t.rank}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{t.topic}</p>
                      <p className="text-[10px] text-slate-500">
                        {t.subject} • {t.attempts.toLocaleString()} Answers
                      </p>
                    </div>
                    <span className="bg-rose-100 text-rose-800 font-black text-xs px-2 py-0.5 rounded">
                      {t.avgScore}% Avg
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsWeakestTopicsModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. MODAL: TOP TOPICS */}
      {/* ==================================================================== */}
      {isTopTopicsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Highest Scoring Topics</h3>
              <button
                onClick={() => setIsTopTopicsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {topPerformingTopics.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No top performing topics recorded yet.
                </div>
              ) : (
                topPerformingTopics.map((t) => (
                  <div
                    key={t.rank}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{t.topic}</p>
                      <p className="text-[10px] text-slate-500">
                        {t.subject} • {t.attempts.toLocaleString()} Answers
                      </p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-2 py-0.5 rounded">
                      {t.avgScore}% Avg
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsTopTopicsModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
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
