import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { bannerService } from '@/services/bannerService';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Bookmark,
  Headphones,
  Radio,
  Trophy,
  FileText,
  Target,
  Zap,
  TrendingUp,
  Clock,
  Layers,
  Crown,
} from 'lucide-react';
import type { PopularTestSeriesCard } from '@/types';
import { OnboardingModal } from '@/components/student/OnboardingModal';
import { SectionTitle, studentCard } from '@/components/student/StudentUI';

export const Home: React.FC = () => {
  const { user, isPro } = useAuth();
  const { selectedExam } = useExam();
  const navigate = useNavigate();

  // Modal state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Hero banner slide state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Real-time tick for countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Dynamic Hero Banners (Admin-controlled)
  const audience = isPro ? 'pro' : 'free';
  const { data: banners = [] } = useQuery({
    queryKey: ['hero-banners', audience],
    queryFn: () => bannerService.getActiveBanners({ audience, placement: 'home_hero' }),
    staleTime: 30000,
  });

  // 2. Active Live Test
  const { data: activeLiveTest } = useQuery({
    queryKey: ['active-live-test'],
    queryFn: () => api.getActiveLiveTest(),
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // 3. User Attempts for Continue Practice & Performance
  const { data: userAttempts = [] } = useQuery({
    queryKey: ['home-user-attempts', user?.id],
    queryFn: () => (user?.id ? api.getUserAttempts(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const inProgressAttempt = useMemo(
    () => userAttempts.find((a) => a.status === 'in_progress'),
    [userAttempts]
  );

  const completedAttempts = useMemo(
    () => userAttempts.filter((a) => a.status === 'completed'),
    [userAttempts]
  );

  // Calculated user stats (real attempts only; no placeholder numbers)
  const performanceStats = useMemo(() => {
    const completedCount = completedAttempts.length;
    const correct = completedAttempts.reduce((sum, a) => sum + (a.correctCount || 0), 0);
    const answered = completedAttempts.reduce(
      (sum, a) => sum + (a.correctCount || 0) + (a.wrongCount || 0),
      0
    );
    const bestPct = completedAttempts.reduce((best, a) => {
      const pct = a.totalMarks ? (a.score / a.totalMarks) * 100 : 0;
      return Math.max(best, pct);
    }, 0);
    return {
      completedCount,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null,
      answered,
      bestPct: completedCount > 0 ? Math.round(bestPct) : null,
    };
  }, [completedAttempts]);

  // 4. Popular test series cards (admin-managed; no invented fallback cards)
  const { data: popularTestSeriesCards = [] } = useQuery<PopularTestSeriesCard[]>({
    queryKey: ['popular-test-series-showcase'],
    queryFn: () => api.getPopularTestSeriesCards(),
    staleTime: 60000,
  });
  const popularSeries = useMemo(
    () =>
      popularTestSeriesCards
        .filter((card) => card.isActive !== false)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
        .slice(0, 6),
    [popularTestSeriesCards]
  );

  // Leaderboard data
  const { data: leaderboardRows = [] } = useQuery({
    queryKey: ['home-leaderboard'],
    queryFn: () => api.getAppLeaderboard('west_bengal'),
    staleTime: 60000,
  });
  const topPerformers = leaderboardRows.slice(0, 5).map((row) => ({
    rank: Number(row.rank),
    name: row.display_name,
    score: Math.round(Number(row.average_percentage) || 0),
    tests: Number(row.tests_count) || 0,
  }));

  // Live test timing
  const liveStart = activeLiveTest?.startAt ? new Date(activeLiveTest.startAt).getTime() : null;
  const msToStart = liveStart ? liveStart - currentTime : 0;
  const isLiveNow = !!activeLiveTest && (liveStart === null || msToStart <= 0);
  const countdown = useMemo(() => {
    const t = Math.max(0, msToStart);
    return {
      d: Math.floor(t / 86400000),
      h: Math.floor((t / 3600000) % 24),
      m: Math.floor((t / 60000) % 60),
      s: Math.floor((t / 1000) % 60),
    };
  }, [msToStart]);
  const liveDateLabel = liveStart
    ? new Date(liveStart).toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  // Slide rotation for Hero Banner
  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, isHovered]);

  const openBanner = (index: number) => {
    const b = banners[index];
    if (!b) return;
    bannerService.trackBannerClick(b.id);
    if (b.primaryCtaLink?.startsWith('http')) {
      window.open(b.primaryCtaLink, '_blank', 'noopener');
    } else {
      navigate(b.primaryCtaLink || '/test-series');
    }
  };

  const quickActions = [
    {
      title: 'Test Series',
      subtitle: 'Full mocks & PYQs',
      route: '/test-series',
      icon: FileText,
      tone: 'bg-indigo-50 text-[#3142D6] dark:bg-indigo-950/50 dark:text-indigo-300',
    },
    {
      title: 'Topic Practice',
      subtitle: 'Chapter drills',
      route: '/practice',
      icon: Zap,
      tone: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
    },
    {
      title: 'Saved Questions',
      subtitle: 'Your bookmarks',
      route: '/saved-questions',
      icon: Bookmark,
      tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
    {
      title: 'Audio Books',
      subtitle: 'Listen & learn',
      route: '/audio-books',
      icon: Headphones,
      tone: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
    },
  ];

  const firstName = user?.fullName?.trim().split(/\s+/)[0];
  const hour = new Date(currentTime).getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const ringPct = performanceStats.accuracy ?? 0;
  const ringColor =
    performanceStats.accuracy === null
      ? '#8FB3FF'
      : ringPct >= 75
        ? '#34D399'
        : ringPct >= 50
          ? '#FBBF24'
          : '#F87171';

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── 1. WELCOME & READINESS BAND ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121A4D] via-[#1E2A8A] to-[#3142D6] text-white">
        <div
          className="pointer-events-none absolute -right-20 -top-24 w-80 h-80 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-1/3 -bottom-28 w-72 h-72 rounded-full bg-[#4F7BFF]/25 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 p-5 sm:p-7 lg:p-8">
          <div className="min-w-0 flex flex-col justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-white/70">{greeting},</p>
              <h1 className="mt-0.5 text-[26px] sm:text-[32px] font-black tracking-tight leading-tight">
                {firstName ? `${firstName} 👋` : 'Welcome back 👋'}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  to="/test-series"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/12 hover:bg-white/20 border border-white/20 text-[12.5px] font-bold transition-colors"
                >
                  <Target className="w-3.5 h-3.5 text-amber-300" />
                  {selectedExam?.title
                    ? `Preparing for ${selectedExam.title}`
                    : 'Choose your target exam'}
                  <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                </Link>
                {isPro && (
                  <span className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-amber-400/20 border border-amber-300/30 text-amber-200 text-[12.5px] font-bold">
                    <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    Pro member
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link
                to={
                  inProgressAttempt
                    ? `/exams/${inProgressAttempt.testId}/runner?attemptId=${inProgressAttempt.id}`
                    : '/test-series'
                }
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white text-[#1E2A8A] text-sm font-extrabold hover:bg-indigo-50 transition-colors shadow-[0_8px_24px_rgba(5,10,40,0.25)]"
              >
                {inProgressAttempt ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span className="truncate max-w-[260px]">
                      Resume {inProgressAttempt.testTitle || 'your test'}
                    </span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Take a mock test
                  </>
                )}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/practice"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-sm font-bold transition-colors"
              >
                Practice by chapter
              </Link>
            </div>
          </div>

          {/* Readiness panel */}
          <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm p-4 sm:p-5 lg:w-[400px]">
            <div className="flex items-center gap-4">
              <div className="relative w-[92px] h-[92px] shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="10"
                  />
                  {ringPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(ringPct / 100) * 263.9} 263.9`}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black leading-none">
                    {performanceStats.accuracy === null ? '–' : `${performanceStats.accuracy}%`}
                  </span>
                  <span className="text-[10px] font-semibold text-white/65 mt-0.5">Accuracy</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8FB3FF]">
                  Exam readiness
                </p>
                <p className="mt-1 text-[15px] font-extrabold leading-snug">
                  {performanceStats.completedCount === 0
                    ? 'Take your first mock to unlock your readiness score'
                    : ringPct >= 75
                      ? "You're exam ready. Keep the streak!"
                      : ringPct >= 50
                        ? 'Almost there — keep practising'
                        : "Let's build your accuracy"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Tests done', value: performanceStats.completedCount },
                {
                  label: 'Best score',
                  value: performanceStats.bestPct === null ? '–' : `${performanceStats.bestPct}%`,
                },
                { label: 'Questions', value: performanceStats.answered.toLocaleString('en-IN') },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 px-2.5 py-2 text-center">
                  <p className="text-[17px] font-black leading-tight">{s.value}</p>
                  <p className="text-[10.5px] font-semibold text-white/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── MAIN COLUMN ── */}
        <div className="space-y-6 min-w-0">
          {/* 2. Live test (only when one actually exists) */}
          {activeLiveTest && (
            <section
              className={`${studentCard} p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-rose-200/70 dark:border-rose-900/50`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                  <Radio className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                      {isLiveNow ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                          now
                        </>
                      ) : (
                        'Upcoming live test'
                      )}
                    </span>
                    {liveDateLabel && (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {liveDateLabel}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-[15px] font-extrabold text-slate-900 dark:text-white truncate">
                    {activeLiveTest.title || 'Live mock test'}
                  </h3>
                  {(activeLiveTest.durationMinutes || activeLiveTest.totalQuestions) && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {[
                        activeLiveTest.totalQuestions
                          ? `${activeLiveTest.totalQuestions} questions`
                          : '',
                        activeLiveTest.durationMinutes
                          ? `${activeLiveTest.durationMinutes} min`
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                {!isLiveNow && (
                  <div className="flex items-center gap-1.5" aria-label="Time until start">
                    {[
                      ['d', countdown.d],
                      ['h', countdown.h],
                      ['m', countdown.m],
                      ['s', countdown.s],
                    ].map(([unit, v]) => (
                      <span
                        key={unit as string}
                        className="min-w-[44px] text-center px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] font-black text-slate-800 dark:text-slate-100 tabular-nums"
                      >
                        {String(v).padStart(2, '0')}
                        <span className="text-[10px] font-bold text-slate-400 ml-0.5">{unit}</span>
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  to="/live-test"
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors"
                >
                  {isLiveNow ? 'Join now' : 'View details'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          )}

          {/* 3. Admin banners */}
          {banners.length > 0 && (
            <section
              className="relative w-full rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800 group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <button
                type="button"
                className="block w-full aspect-[16/5] min-h-[140px] cursor-pointer"
                onClick={() => openBanner(currentSlide)}
                aria-label={banners[currentSlide]?.title || 'Open promotion'}
              >
                <img
                  src={banners[currentSlide]?.imageUrl || '/images/home_hero_banner.png'}
                  alt={banners[currentSlide]?.title || ''}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/home_hero_banner.png';
                  }}
                />
              </button>
              {banners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((p) => (p === 0 ? banners.length - 1 : p - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-white/90 text-slate-800 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((p) => (p + 1) % banners.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-white/90 text-slate-800 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/50 backdrop-blur-sm">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlide(idx)}
                        className={cn(
                          'h-1.5 rounded-full transition-all cursor-pointer',
                          currentSlide === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                        )}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {/* 4. Quick actions */}
          <section className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-3">
            {quickActions.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.route}
                  className={`${studentCard} p-4 flex items-center gap-3 hover:-translate-y-0.5 hover:border-[#3142D6]/30 transition-all group`}
                >
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                      card.tone
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13.5px] font-extrabold text-slate-900 dark:text-white truncate group-hover:text-[#1E2A8A] dark:group-hover:text-[#8FB3FF]">
                      {card.title}
                    </h3>
                    <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {card.subtitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </section>

          {/* 5. Popular test series */}
          {popularSeries.length > 0 && (
            <section className="space-y-3">
              <SectionTitle
                title="Popular test series"
                subtitle="Most chosen by aspirants"
                action={
                  <Link
                    to="/test-series"
                    className="text-[13px] font-bold text-[#3142D6] dark:text-[#8FB3FF] hover:underline inline-flex items-center gap-1"
                  >
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                {popularSeries.map((series) => {
                  const target = series.route || `/test-series/${series.testSeriesId || series.id}`;
                  return (
                    <button
                      type="button"
                      key={series.id}
                      onClick={() => navigate(target)}
                      className={`${studentCard} p-4 text-left flex flex-col gap-3 hover:-translate-y-0.5 hover:border-[#3142D6]/30 transition-all group cursor-pointer`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0">
                          {series.cardLogoUrl ? (
                            <img
                              src={series.cardLogoUrl}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Layers className="w-5 h-5 text-[#3142D6]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {series.badgeText && (
                            <span className="inline-block px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300 text-[10px] font-black mb-0.5">
                              {series.badgeText}
                            </span>
                          )}
                          <h3 className="text-[14.5px] font-extrabold text-slate-900 dark:text-white truncate group-hover:text-[#1E2A8A] dark:group-hover:text-[#8FB3FF]">
                            {series.title}
                          </h3>
                          {series.subtitle && (
                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">
                              {series.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#3142D6] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <div className="grid grid-cols-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 divide-x divide-slate-200/70 dark:divide-slate-700">
                        {[
                          ['Full mocks', series.fullMockCount ?? 0],
                          ['Topic tests', series.topicTestCount ?? 0],
                          ['PYQs', series.pyqTestCount ?? 0],
                        ].map(([label, value]) => (
                          <div key={label as string} className="py-2 text-center">
                            <p className="text-[14px] font-black text-[#121A4D] dark:text-white leading-tight">
                              {value}
                            </p>
                            <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── SIDE COLUMN ── */}
        <aside className="space-y-6 min-w-0">
          {/* Leaderboard */}
          <section className={`${studentCard} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                    West Bengal toppers
                  </h2>
                  <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                    By average score
                  </p>
                </div>
              </div>
              <Link
                to="/rank"
                className="text-[13px] font-bold text-[#3142D6] dark:text-[#8FB3FF] hover:underline"
              >
                View all
              </Link>
            </div>
            {topPerformers.length === 0 ? (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 py-4 text-center">
                Rankings appear once students complete tests.
              </p>
            ) : (
              <ol className="space-y-2">
                {topPerformers.map((p) => (
                  <li
                    key={`${p.rank}-${p.name}`}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <span
                      className={cn(
                        'w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0',
                        p.rank === 1
                          ? 'bg-amber-400 text-amber-950'
                          : p.rank === 2
                            ? 'bg-slate-300 text-slate-800'
                            : p.rank === 3
                              ? 'bg-orange-300 text-orange-950'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      )}
                    >
                      {p.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {p.tests} {p.tests === 1 ? 'test' : 'tests'}
                      </p>
                    </div>
                    <span className="text-[14px] font-black text-[#1E2A8A] dark:text-[#8FB3FF]">
                      {p.score}%
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Study tip */}
          <section className={`${studentCard} p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#3142D6] dark:text-indigo-300 flex items-center justify-center">
                <TrendingUp className="w-[18px] h-[18px]" />
              </div>
              <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                Study tip
              </h2>
            </div>
            <p className="text-[13px] leading-relaxed font-medium text-slate-600 dark:text-slate-300">
              Guard against negative marking in the first pass: skip questions you are less than 60%
              sure of, then return to them once you have banked the easy marks.
            </p>
            <Link
              to="/practice?tab=mistakes"
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-[#3142D6] dark:text-[#8FB3FF] hover:underline"
            >
              Revise your mistakes <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </section>

          {/* Upgrade (free users only) */}
          {!isPro && (
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121A4D] to-[#3142D6] text-white p-5">
              <Crown
                className="absolute -right-4 -bottom-5 w-24 h-24 text-white/[0.07]"
                aria-hidden="true"
              />
              <p className="flex items-center gap-1.5 text-amber-300 text-[11px] font-black tracking-wide">
                <Crown className="w-4 h-4 fill-amber-300" /> PRO PASS
              </p>
              <h2 className="mt-1.5 text-[17px] font-extrabold leading-snug">
                Unlock every mock, solution and rank report
              </h2>
              <Link
                to="/subscription"
                className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#121A4D] text-sm font-extrabold transition-colors"
              >
                View plans <ArrowRight className="w-4 h-4" />
              </Link>
            </section>
          )}
        </aside>
      </div>

      {/* Onboarding modal */}
      {isOnboardingOpen && (
        <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
      )}
    </div>
  );
};
