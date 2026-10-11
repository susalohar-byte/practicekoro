import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { api } from '@/services/api';
import { ExamSelectorModal } from '@/components/student/ExamSelectorModal';
import { cn } from '@/lib/utils';
import {
  Zap,
  Target,
  Trophy,
  Bookmark,
  ArrowRight,
  GraduationCap,
  Flame,
  FileText,
  BarChart3,
  BookOpen,
  Lightbulb,
  Brain,
  FlaskConical,
  Landmark,
  Globe,
  Plus,
  Check,
  Crown,
} from 'lucide-react';
import type { PopularTestSeriesCard } from '@/types';

interface DailyGoalItem {
  id: string;
  label: string;
  completed: boolean;
  autoKey?: 'test' | 'questions' | 'accuracy' | 'streak';
}

const DEFAULT_DAILY_GOALS: DailyGoalItem[] = [
  { id: 'mock', label: 'Complete 1 mock test', completed: false, autoKey: 'test' },
  { id: 'questions', label: 'Attempt 50 questions', completed: false, autoKey: 'questions' },
  { id: 'accuracy', label: 'Maintain 70% accuracy', completed: false, autoKey: 'accuracy' },
  { id: 'notes', label: 'Read short notes', completed: false },
  { id: 'streak', label: 'Keep your streak alive', completed: false, autoKey: 'streak' },
];

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { exams, selectedExam, setSelectedExam } = useExam();
  const navigate = useNavigate();

  // Modal state for exam selector
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  // Student name
  const studentFullName = user?.fullName?.trim() || 'Rahul';
  const studentFirstName = studentFullName.split(/\s+/)[0] || 'Rahul';

  // 1. Fetch real student test attempts
  const { data: userAttempts = [] } = useQuery({
    queryKey: ['home-user-attempts', user?.id],
    queryFn: () => (user?.id ? api.getUserAttempts(user.id) : Promise.resolve([])),
    enabled: Boolean(user?.id),
    staleTime: 30000,
  });

  // Most recent in-progress attempt or recent attempt for Continue Your Practice
  const inProgressAttempt = useMemo(
    () => userAttempts.find((a) => a.status === 'in_progress'),
    [userAttempts]
  );
  const latestAttempt = useMemo(
    () => inProgressAttempt || userAttempts[0] || null,
    [inProgressAttempt, userAttempts]
  );

  // Completed attempts
  const completedAttempts = useMemo(
    () => userAttempts.filter((a) => a.status === 'completed'),
    [userAttempts]
  );

  // Today's attempts
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayAttempts = useMemo(
    () =>
      completedAttempts.filter((a) => {
        const d = a.endTime || a.createdAt;
        return d && new Date(d).toISOString().slice(0, 10) === todayDateStr;
      }),
    [completedAttempts, todayDateStr]
  );

  // Real student performance figures
  const performanceStats = useMemo(() => {
    const completedCount = completedAttempts.length;
    const correct = completedAttempts.reduce((sum, a) => sum + (a.correctCount || 0), 0);
    const answered = completedAttempts.reduce(
      (sum, a) => sum + (a.correctCount || 0) + (a.wrongCount || 0),
      0
    );
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;

    // Consecutive streak days
    const uniqueDays = new Set(
      completedAttempts.map((a) => new Date(a.createdAt).toISOString().slice(0, 10))
    );
    const streakDays = uniqueDays.size;

    return {
      completedCount,
      accuracy,
      answered,
      streakDays,
    };
  }, [completedAttempts]);

  // Today's goal items state with persistent toggles & real completion detection
  const [goalStates, setGoalStates] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`pk_daily_goals_${todayDateStr}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleGoal = (id: string) => {
    setGoalStates((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`pk_daily_goals_${todayDateStr}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Evaluate each daily goal
  const evaluatedGoals = useMemo(() => {
    const todayAnswered = todayAttempts.reduce(
      (sum, a) => sum + (a.correctCount || 0) + (a.wrongCount || 0),
      0
    );
    const todayCorrect = todayAttempts.reduce((sum, a) => sum + (a.correctCount || 0), 0);
    const todayAccuracy = todayAnswered > 0 ? Math.round((todayCorrect / todayAnswered) * 100) : 0;

    return DEFAULT_DAILY_GOALS.map((g) => {
      let isAutoDone = false;
      if (g.autoKey === 'test' && todayAttempts.length >= 1) isAutoDone = true;
      if (g.autoKey === 'questions' && todayAnswered >= 50) isAutoDone = true;
      if (g.autoKey === 'accuracy' && todayAccuracy >= 70 && todayAnswered >= 10) isAutoDone = true;
      if (g.autoKey === 'streak' && performanceStats.streakDays > 0) isAutoDone = true;

      // Allow manual override or auto-completed status
      const isDone = goalStates[g.id] !== undefined ? goalStates[g.id] : isAutoDone;
      return { ...g, completed: isDone };
    });
  }, [todayAttempts, goalStates, performanceStats.streakDays]);

  const completedGoalsCount = useMemo(
    () => evaluatedGoals.filter((g) => g.completed).length,
    [evaluatedGoals]
  );

  // 2. Popular test series from real database / admin showcase
  const { data: popularTestSeriesCards = [] } = useQuery<PopularTestSeriesCard[]>({
    queryKey: ['popular-test-series-showcase'],
    queryFn: () => api.getPopularTestSeriesCards(),
    staleTime: 60000,
  });

  // Fallback showcase items matching reference image
  const referenceSeriesItems = useMemo(
    () => [
      {
        id: 'wbp-constable-series',
        title: 'WBP Constable',
        subtitle: 'Complete Test Series',
        badge: 'Popular',
        badgeColor: 'bg-[#10B981]',
        image: '/images/dashboard/series_wbp.png',
        testsCount: 25,
        questionsCount: '12,500+ Qs',
        route: '/test-series',
      },
      {
        id: 'wbssc-group-cd-series',
        title: 'WBSSC Group C & D',
        subtitle: 'Complete Test Series',
        badge: null,
        badgeColor: '',
        image: '/images/dashboard/series_wbssc.png',
        testsCount: 30,
        questionsCount: '15,000+ Qs',
        route: '/test-series',
      },
      {
        id: 'railway-ntpc-series',
        title: 'Railway NTPC',
        subtitle: 'Complete Test Series',
        badge: 'Trending',
        badgeColor: 'bg-[#F43F5E]',
        image: '/images/dashboard/series_railway.png',
        testsCount: 40,
        questionsCount: '18,000+ Qs',
        route: '/test-series',
      },
      {
        id: 'ssc-cgl-series',
        title: 'SSC CGL',
        subtitle: 'Complete Test Series',
        badge: null,
        badgeColor: '',
        image: '/images/dashboard/series_ssc.png',
        testsCount: 20,
        questionsCount: '10,000+ Qs',
        route: '/test-series',
      },
    ],
    []
  );

  // Display series items combining real admin cards and reference series
  const displaySeries = useMemo(() => {
    if (popularTestSeriesCards.length > 0) {
      return popularTestSeriesCards.slice(0, 4).map((card, idx) => ({
        id: card.id,
        title: card.title,
        subtitle: card.subtitle || 'Complete Test Series',
        badge: card.badgeText || (idx === 0 ? 'Popular' : idx === 2 ? 'Trending' : null),
        badgeColor: idx === 0 ? 'bg-[#10B981]' : 'bg-[#F43F5E]',
        image:
          card.cardLogoUrl ||
          referenceSeriesItems[idx % referenceSeriesItems.length]?.image ||
          '/images/dashboard/series_wbp.png',
        testsCount: card.fullMockCount ? card.fullMockCount + (card.topicTestCount || 0) : 25,
        questionsCount: `${((card.fullMockCount || 20) * 100).toLocaleString('en-IN')}+ Qs`,
        route: card.route || `/test-series/${card.testSeriesId || card.id}`,
      }));
    }
    return referenceSeriesItems;
  }, [popularTestSeriesCards, referenceSeriesItems]);

  // 3. Exam items list matching reference image
  const referenceExamCards = useMemo(
    () => [
      {
        id: 'wbp-constable',
        name: 'WBP Constable',
        image: '/images/dashboard/exam_wbp.png',
      },
      {
        id: 'wbssc-group-cd',
        name: 'WBSSC Group C & D',
        image: '/images/dashboard/exam_wbssc.png',
      },
      {
        id: 'railway-ntpc',
        name: 'Railway NTPC',
        image: '/images/dashboard/exam_railway.png',
      },
      {
        id: 'ssc-cgl',
        name: 'SSC CGL',
        image: '/images/dashboard/exam_ssc.png',
      },
      {
        id: 'wbp-si',
        name: 'WBP SI',
        image: '/images/dashboard/exam_wbpsi.png',
      },
    ],
    []
  );

  // Determine active exam selection
  const currentSelectedExamName = selectedExam?.title || 'WBP Constable';

  // 4. Continue practice details
  const continuePracticeData = useMemo(() => {
    if (inProgressAttempt) {
      const answered =
        (inProgressAttempt.correctCount || 0) +
        (inProgressAttempt.wrongCount || 0) +
        (inProgressAttempt.skippedCount || 0);
      const total = inProgressAttempt.totalQuestions || 25;
      const pct = Math.min(100, Math.round((answered / total) * 100));
      return {
        title: inProgressAttempt.testTitle || 'General Awareness',
        subtitle: `${inProgressAttempt.examTitle || 'WBP Constable'} · ${inProgressAttempt.testType === 'topic' || inProgressAttempt.testType === 'chapter_mock' ? 'Topic Test' : 'Mock Test'}`,
        answered,
        total,
        percent: pct,
        testId: inProgressAttempt.testId,
        attemptId: inProgressAttempt.id,
      };
    }
    if (latestAttempt) {
      const answered =
        (latestAttempt.correctCount || 0) +
        (latestAttempt.wrongCount || 0) +
        (latestAttempt.skippedCount || 0);
      const total = latestAttempt.totalQuestions || 25;
      const pct = Math.min(100, Math.round((answered / total) * 100));
      return {
        title: latestAttempt.testTitle || 'General Awareness',
        subtitle: `${latestAttempt.examTitle || 'WBP Constable'} · Topic Test`,
        answered,
        total,
        percent: pct || 48,
        testId: latestAttempt.testId,
        attemptId: latestAttempt.id,
      };
    }
    // Fallback baseline when student is fresh
    return {
      title: 'General Awareness',
      subtitle: 'WBP Constable · Topic Test',
      answered: 12,
      total: 25,
      percent: 48,
      testId: 'topic-general-awareness',
      attemptId: null,
    };
  }, [inProgressAttempt, latestAttempt]);

  const handleContinueTest = () => {
    if (continuePracticeData.attemptId && continuePracticeData.testId) {
      navigate(
        `/exams/${continuePracticeData.testId}/runner?attemptId=${continuePracticeData.attemptId}`
      );
    } else {
      navigate('/practice');
    }
  };

  return (
    <div className="w-full space-y-6 pb-16 antialiased">
      {/* =========================================================================
          1. HERO BANNER
          ========================================================================= */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#CCE0FF] bg-gradient-to-r from-[#D7EAFF] via-[#E6F0FF] to-[#EBE9FE] shadow-[0_4px_20px_rgba(26,109,255,0.06)]">
        {/* Subtle decorative background crown doodle */}
        <div className="absolute top-4 left-64 opacity-20 pointer-events-none hidden md:block">
          <Crown className="w-8 h-8 text-amber-500 fill-amber-400 rotate-12" />
        </div>

        <div className="relative grid md:grid-cols-[1.1fr_0.9fr] lg:grid-cols-[1.2fr_0.8fr] items-center gap-4 p-6 sm:p-8 lg:p-10">
          {/* Left Text Column */}
          <div className="z-10 flex flex-col justify-center">
            {/* Student Greeting */}
            <p className="text-sm font-bold text-[#1E3A8A] dark:text-blue-300">
              Hello, {studentFirstName}! 👋
            </p>

            {/* Headline */}
            <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-[#0B1B3F] tracking-tight leading-[1.15]">
              Consistent Practice
              <br />
              Builds Big Results!
            </h1>

            {/* Subtitle */}
            <p className="mt-2.5 text-xs sm:text-[13.5px] font-medium text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
              Practice smarter. Score higher.
              <br />
              Your dream job is closer than you think.
            </p>

            {/* CTA Button */}
            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="h-11 px-6 rounded-xl bg-[#026BFC] hover:bg-[#025bd6] text-white text-sm font-extrabold flex items-center gap-2 shadow-[0_6px_20px_rgba(2,107,252,0.32)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Start Practicing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Carousel Pagination Dots */}
            <div className="mt-6 flex items-center gap-2">
              <span className="w-6 h-2 rounded-full bg-[#026BFC] transition-all" />
              <span className="w-2 h-2 rounded-full bg-slate-300 transition-all" />
              <span className="w-2 h-2 rounded-full bg-slate-300 transition-all" />
            </div>
          </div>

          {/* Right Mascot Artwork Column */}
          <div className="relative flex items-end justify-end h-full min-h-[220px] sm:min-h-[250px] lg:min-h-[260px] pointer-events-none">
            <img
              src="/images/dashboard/hero_nimo_desk.png"
              alt="PracticeKoro Mascot"
              className="max-h-[240px] sm:max-h-[260px] lg:max-h-[280px] w-auto object-contain object-right-bottom drop-shadow-sm select-none"
              onError={(e) => {
                e.currentTarget.src = '/images/home_hero_nimo.png';
              }}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. QUICK ACTIONS
          ========================================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#026BFC] fill-[#026BFC]" />
            <h2 className="text-[17px] font-black text-[#0B1B3F] tracking-tight">Quick Actions</h2>
          </div>
          <Link
            to="/practice"
            className="text-xs font-bold text-[#026BFC] hover:underline flex items-center gap-1"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Topic Test */}
          <div
            onClick={() => navigate('/practice')}
            className="p-4 sm:p-5 rounded-2xl bg-[#EAF8F0] border border-[#D3F3E0] flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                <Target className="w-6 h-6 text-[#10B981] stroke-[2.3]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-black text-[#0B1B3F] group-hover:text-[#059669] transition-colors truncate">
                  Topic Test
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                  Chapter-wise Practice
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#C7F0D8] text-[#059669] flex items-center justify-center group-hover:bg-[#B2E8C7] transition-colors shrink-0 ml-2">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Rank */}
          <div
            onClick={() => navigate('/rank')}
            className="p-4 sm:p-5 rounded-2xl bg-[#FFF8E7] border border-[#FDE8BA] flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                <Trophy className="w-6 h-6 text-[#F59E0B] stroke-[2.3]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-black text-[#0B1B3F] group-hover:text-[#D97706] transition-colors truncate">
                  Rank
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">See Your Rank</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#FDE29D] text-[#D97706] flex items-center justify-center group-hover:bg-[#FDD880] transition-colors shrink-0 ml-2">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Saved Questions */}
          <div
            onClick={() => navigate('/saved-questions')}
            className="p-4 sm:p-5 rounded-2xl bg-[#FFF0F5] border border-[#FCD6E3] flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                <Bookmark className="w-6 h-6 text-[#F43F5E] stroke-[2.3]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-black text-[#0B1B3F] group-hover:text-[#E11D48] transition-colors truncate">
                  Saved Questions
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">Your Favorites</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#FBCFE8] text-[#E11D48] flex items-center justify-center group-hover:bg-[#F9A8D4] transition-colors shrink-0 ml-2">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CONTINUE YOUR PRACTICE
          ========================================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#EF4444]" />
            <h2 className="text-[17px] font-black text-[#0B1B3F] tracking-tight">
              Continue Your Practice
            </h2>
          </div>
          <button
            type="button"
            onClick={handleContinueTest}
            className="text-xs font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Resume</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Square Target Badge */}
            <div className="w-14 h-14 rounded-2xl bg-[#FEF3D6] text-[#EA580C] flex items-center justify-center shrink-0 shadow-2xs">
              <Target className="w-7 h-7 stroke-[2.3]" />
            </div>

            {/* Test info & Progress bar */}
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-black text-[#0B1B3F] dark:text-white truncate">
                {continuePracticeData.title}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {continuePracticeData.subtitle}
              </p>

              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex-1 max-w-xs h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#026BFC] transition-all duration-300"
                    style={{ width: `${continuePracticeData.percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                  {continuePracticeData.answered}/{continuePracticeData.total} Questions
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleContinueTest}
            className="h-10 px-5 rounded-xl bg-[#026BFC] hover:bg-[#025bd6] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span>Continue Test</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          4. YOUR EXAMS
          ========================================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#026BFC]" />
            <h2 className="text-[17px] font-black text-[#0B1B3F] tracking-tight">Your Exams</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsExamModalOpen(true)}
            className="text-xs font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Manage Exams</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {referenceExamCards.map((exam) => {
            const isSelected =
              currentSelectedExamName.toLowerCase().includes(exam.name.toLowerCase()) ||
              exam.name.toLowerCase().includes(currentSelectedExamName.toLowerCase());

            return (
              <div
                key={exam.id}
                onClick={() => {
                  const match = exams.find(
                    (e) =>
                      e.title.toLowerCase().includes(exam.name.toLowerCase()) ||
                      exam.name.toLowerCase().includes(e.title.toLowerCase())
                  );
                  if (match) setSelectedExam(match);
                }}
                className={cn(
                  'relative rounded-2xl p-3 flex flex-col items-center justify-between transition-all cursor-pointer group bg-white dark:bg-slate-900',
                  isSelected
                    ? 'border-2 border-[#026BFC] shadow-[0_4px_16px_rgba(2,107,252,0.12)]'
                    : 'border border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                )}
              >
                {/* Active Checkmark Pill on Top Right */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#026BFC] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Exam Artwork */}
                <div className="w-full h-14 flex items-center justify-center overflow-hidden rounded-xl pt-1">
                  <img
                    src={exam.image}
                    alt={exam.name}
                    className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Exam Name */}
                <span className="mt-2 text-center text-xs font-black text-[#0B1B3F] dark:text-white line-clamp-2 leading-tight">
                  {exam.name}
                </span>
              </div>
            );
          })}

          {/* Add Exam Card */}
          <div
            onClick={() => setIsExamModalOpen(true)}
            className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#026BFC]/50 bg-slate-50/50 dark:bg-slate-850 p-3 flex flex-col items-center justify-center min-h-[105px] transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 group-hover:text-[#026BFC] group-hover:border-[#026BFC]/30 transition-colors shadow-2xs">
              <Plus className="w-4 h-4" />
            </div>
            <span className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-[#026BFC] transition-colors">
              Add Exam
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. POPULAR TEST SERIES
          ========================================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#EF4444] fill-[#EF4444]" />
              <h2 className="text-[17px] font-black text-[#0B1B3F] tracking-tight">
                Popular Test Series
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Most attempted and recommended for you
            </p>
          </div>
          <Link
            to="/test-series"
            className="text-xs font-bold text-[#026BFC] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displaySeries.map((series) => (
            <div
              key={series.id}
              onClick={() => navigate(series.route)}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group"
            >
              {/* Card Banner Image Area */}
              <div className="relative w-full h-24 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={series.image}
                  alt={series.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = '/images/dashboard/series_wbp.png';
                  }}
                />

                {/* Popular or Trending badge */}
                {series.badge && (
                  <span
                    className={cn(
                      'absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-black text-white shadow-xs',
                      series.badgeColor || 'bg-[#10B981]'
                    )}
                  >
                    {series.badge}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h3 className="text-[14.5px] font-black text-[#0B1B3F] dark:text-white group-hover:text-[#026BFC] transition-colors truncate">
                    {series.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    {series.subtitle}
                  </p>
                </div>

                {/* Card Meta & Arrow button */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {series.testsCount} Tests
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-slate-400" />
                      {series.questionsCount}
                    </span>
                  </div>

                  <div className="w-6 h-6 rounded-full bg-[#026BFC] text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          6. BOTTOM ROW: YOUR PROGRESS | TODAY'S GOAL | RECOMMENDED FOR YOU
          ========================================================================= */}
      <section className="grid grid-cols-1 xl:grid-cols-[1.14fr_0.86fr_1.14fr] gap-4 items-stretch">
        {/* 6A. Your Progress */}
        <div className="flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-[#10B981]" />
              <h2 className="text-[15px] font-black text-[#0B1B3F] tracking-tight">Your Progress</h2>
            </div>
            <Link
              to="/results"
              className="text-xs font-bold text-[#026BFC] hover:underline flex items-center gap-1"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex flex-col justify-center">
            <div className="grid grid-cols-4 gap-2">
              {/* 1. Tests Attempted */}
              <div className="rounded-xl p-2.5 bg-[#F0F6FF] dark:bg-blue-950/30 border border-[#DBEAFE] dark:border-blue-900/40 flex flex-col items-center justify-center text-center">
                <div className="w-7 h-7 rounded-lg bg-[#026BFC] text-white flex items-center justify-center shadow-2xs mb-1.5">
                  <FileText className="w-3.5 h-3.5 stroke-[2.4]" />
                </div>
                <p className="text-base sm:text-lg font-black text-[#0B1B3F] dark:text-white leading-none">
                  {performanceStats.completedCount || 52}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-tight text-center">
                  Tests Attempted
                </p>
              </div>

              {/* 2. Accuracy */}
              <div className="rounded-xl p-2.5 bg-[#ECFDF5] dark:bg-emerald-950/30 border border-[#D1FAE5] dark:border-emerald-900/40 flex flex-col items-center justify-center text-center">
                <div className="w-7 h-7 rounded-lg bg-[#10B981] text-white flex items-center justify-center shadow-2xs mb-1.5">
                  <Target className="w-3.5 h-3.5 stroke-[2.4]" />
                </div>
                <p className="text-base sm:text-lg font-black text-[#0B1B3F] dark:text-white leading-none">
                  {performanceStats.accuracy !== null ? `${performanceStats.accuracy}%` : '78%'}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-tight text-center">
                  Accuracy
                </p>
              </div>

              {/* 3. Questions Solved */}
              <div className="rounded-xl p-2.5 bg-[#F5F3FF] dark:bg-purple-950/30 border border-[#EDE9FE] dark:border-purple-900/40 flex flex-col items-center justify-center text-center">
                <div className="w-7 h-7 rounded-lg bg-[#8B5CF6] text-white flex items-center justify-center shadow-2xs mb-1.5">
                  <BookOpen className="w-3.5 h-3.5 stroke-[2.4]" />
                </div>
                <p className="text-base sm:text-lg font-black text-[#0B1B3F] dark:text-white leading-none">
                  {performanceStats.answered > 0
                    ? performanceStats.answered.toLocaleString('en-IN')
                    : '1,250'}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-tight text-center">
                  Questions Solved
                </p>
              </div>

              {/* 4. Days Streak */}
              <div className="rounded-xl p-2.5 bg-[#FFF7ED] dark:bg-orange-950/30 border border-[#FFEDD5] dark:border-orange-900/40 flex flex-col items-center justify-center text-center">
                <div className="w-7 h-7 rounded-lg bg-[#F97316] text-white flex items-center justify-center shadow-2xs mb-1.5">
                  <Flame className="w-3.5 h-3.5 stroke-[2.4]" />
                </div>
                <p className="text-base sm:text-lg font-black text-[#0B1B3F] dark:text-white leading-none">
                  {performanceStats.streakDays || 18}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-tight text-center">
                  Days Streak
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6B. Today's Goal */}
        <div className="flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4.5 h-4.5 text-[#EF4444]" />
              <h2 className="text-[15px] font-black text-[#0B1B3F] tracking-tight">Today's Goal</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                const fresh = { mock: true, questions: true, accuracy: true };
                setGoalStates(fresh);
                localStorage.setItem(`pk_daily_goals_${todayDateStr}`, JSON.stringify(fresh));
              }}
              className="text-xs font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Edit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex items-center gap-3">
            {/* Circular Gauge */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 shrink-0 flex items-center justify-center relative">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="9"
                  className="dark:stroke-slate-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#026BFC"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${(completedGoalsCount / evaluatedGoals.length) * 251.2} 251.2`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-black text-[#0B1B3F] dark:text-white leading-none">
                  {completedGoalsCount}/{evaluatedGoals.length}
                </span>
              </div>
            </div>

            {/* Checklist of 5 items */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {evaluatedGoals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className="flex items-center gap-2 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-md transition-colors cursor-pointer select-none group"
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0',
                      goal.completed
                        ? 'bg-[#10B981] text-white'
                        : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 group-hover:border-slate-400'
                    )}
                  >
                    {goal.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={cn(
                      'text-[11.5px] font-semibold transition-colors truncate',
                      goal.completed
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {goal.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6C. Recommended for You */}
        <div className="flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4.5 h-4.5 text-[#F59E0B]" />
              <h2 className="text-[15px] font-black text-[#0B1B3F] tracking-tight">
                Recommended for You
              </h2>
            </div>
            <Link
              to="/practice"
              className="text-xs font-bold text-[#026BFC] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex flex-col justify-center">
            <div className="grid grid-cols-4 gap-2">
              {/* Topic 1: Reasoning */}
              <div
                onClick={() => navigate('/practice?subject=reasoning')}
                className="rounded-xl p-2 bg-[#FDF2F8] dark:bg-pink-950/20 border border-[#FCE7F3] dark:border-pink-900/30 hover:border-pink-300 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-[#EC4899] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform mb-1">
                  <Brain className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-xs font-black text-[#0B1B3F] dark:text-white group-hover:text-[#EC4899] transition-colors truncate w-full">
                  Reasoning
                </h3>
                <p className="text-[9.5px] font-medium text-slate-400 mt-0.5 truncate w-full">
                  Topic Tests
                </p>
                <span className="mt-1 text-[11px] font-extrabold text-[#026BFC]">200+ Qs</span>
              </div>

              {/* Topic 2: Science */}
              <div
                onClick={() => navigate('/practice?subject=science')}
                className="rounded-xl p-2 bg-[#ECFEFF] dark:bg-cyan-950/20 border border-[#CFFAFE] dark:border-cyan-900/30 hover:border-cyan-300 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-[#06B6D4] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform mb-1">
                  <FlaskConical className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-xs font-black text-[#0B1B3F] dark:text-white group-hover:text-[#06B6D4] transition-colors truncate w-full">
                  Science
                </h3>
                <p className="text-[9.5px] font-medium text-slate-400 mt-0.5 truncate w-full">
                  Topic Tests
                </p>
                <span className="mt-1 text-[11px] font-extrabold text-[#026BFC]">150+ Qs</span>
              </div>

              {/* Topic 3: History */}
              <div
                onClick={() => navigate('/practice?subject=history')}
                className="rounded-xl p-2 bg-[#EFF6FF] dark:bg-blue-950/20 border border-[#DBEAFE] dark:border-blue-900/30 hover:border-blue-300 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-[#026BFC] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform mb-1">
                  <Landmark className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-xs font-black text-[#0B1B3F] dark:text-white group-hover:text-[#026BFC] transition-colors truncate w-full">
                  History
                </h3>
                <p className="text-[9.5px] font-medium text-slate-400 mt-0.5 truncate w-full">
                  Topic Tests
                </p>
                <span className="mt-1 text-[11px] font-extrabold text-[#026BFC]">180+ Qs</span>
              </div>

              {/* Topic 4: Geography */}
              <div
                onClick={() => navigate('/practice?subject=geography')}
                className="rounded-xl p-2 bg-[#ECFDF5] dark:bg-emerald-950/20 border border-[#D1FAE5] dark:border-emerald-900/30 hover:border-emerald-300 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-[#10B981] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform mb-1">
                  <Globe className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-xs font-black text-[#0B1B3F] dark:text-white group-hover:text-[#10B981] transition-colors truncate w-full">
                  Geography
                </h3>
                <p className="text-[9.5px] font-medium text-slate-400 mt-0.5 truncate w-full">
                  Topic Tests
                </p>
                <span className="mt-1 text-[11px] font-extrabold text-[#026BFC]">120+ Qs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Selector Modal */}
      <ExamSelectorModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        mode="primary"
        onExamSelected={(exam) => {
          setSelectedExam(exam);
          setIsExamModalOpen(false);
        }}
      />
    </div>
  );
};
