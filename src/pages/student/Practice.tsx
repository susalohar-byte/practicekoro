import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  usePracticeRevision,
  useRemoveBookmark,
  useResolveMistake,
} from '@/hooks/usePracticeRevision';
import { useSubscription } from '@/hooks/useSubscription';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { MathText } from '@/components/common/MathText';
import { isMathematicsQuestion } from '@/utils/shortNotes';
import { PageHeader, SectionTitle, FilterChip, studentCard } from '@/components/student/StudentUI';
import { StudentLoading, StudentLoadError } from '@/components/student/StudentLoadState';
import {
  AlertTriangle,
  Bookmark,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Play,
  Languages,
  Trash2,
  Award,
  BookOpen,
  FileText,
  Globe,
  Calculator,
  Brain,
  Monitor,
  Clock,
  Target,
  Sparkles,
  Zap,
  Search,
  X,
  Layers,
  Crown,
  FileCheck,
  Check,
  FlaskConical,
  Landmark,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question, Subject, Chapter, MockTest } from '@/types';

type PracticeTab = 'dashboard' | 'mistakes' | 'bookmarks';

interface PracticeAnswerRecord {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
}

interface EnrichedTopic extends Chapter {
  subject?: Subject;
  subjectName: string;
  tests: MockTest[];
  testsCount: number;
  questionsCount: number;
  hasFreeTest: boolean;
  hasProTest: boolean;
}

/** Theme resolver for subjects to provide consistent pastel accents */
function getSubjectTheme(subjectName: string = '') {
  const lower = subjectName.toLowerCase();
  if (lower.includes('math') || lower.includes('গণিত') || lower.includes('arithmetic')) {
    return {
      icon: Calculator,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/60',
      borderColor: 'border-blue-200/80 dark:border-blue-900/60',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60',
    };
  }
  if (
    lower.includes('reason') ||
    lower.includes('রিজনিং') ||
    lower.includes('intelligence') ||
    lower.includes('gi')
  ) {
    return {
      icon: Brain,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/60',
      borderColor: 'border-rose-200/80 dark:border-rose-900/60',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60',
    };
  }
  if (lower.includes('english') || lower.includes('ইংরেজি')) {
    return {
      icon: Languages,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/60',
      borderColor: 'border-purple-200/80 dark:border-purple-900/60',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60',
    };
  }
  if (lower.includes('bengali') || lower.includes('বাংলা') || lower.includes('literature')) {
    return {
      icon: BookOpen,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/60',
      borderColor: 'border-orange-200/80 dark:border-orange-900/60',
      badgeBg: 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200/60',
    };
  }
  if (
    lower.includes('science') ||
    lower.includes('বিজ্ঞান') ||
    lower.includes('physics') ||
    lower.includes('chemistry') ||
    lower.includes('biology')
  ) {
    return {
      icon: FlaskConical,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60',
      borderColor: 'border-amber-200/80 dark:border-amber-900/60',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60',
    };
  }
  if (lower.includes('history') || lower.includes('ইতিহাস')) {
    return {
      icon: Landmark,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
      borderColor: 'border-emerald-200/80 dark:border-emerald-900/60',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60',
    };
  }
  if (
    lower.includes('polity') ||
    lower.includes('constitution') ||
    lower.includes('সংবিধান') ||
    lower.includes('আইন')
  ) {
    return {
      icon: Scale,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/60',
      borderColor: 'border-indigo-200/80 dark:border-indigo-900/60',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60',
    };
  }
  if (lower.includes('computer') || lower.includes('কম্পিউটার') || lower.includes('it')) {
    return {
      icon: Monitor,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/60',
      borderColor: 'border-sky-200/80 dark:border-sky-900/60',
      badgeBg: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60',
    };
  }
  return {
    icon: Globe,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/60',
    borderColor: 'border-teal-200/80 dark:border-teal-900/60',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/60',
  };
}

export const Practice: React.FC = () => {
  const { user, isPro, isAdmin } = useAuth();
  const { hasAccessToTest } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Fetch practice catalog directly from database (Subjects, Chapters, Tests, Attempts, Question Counts)
  const {
    data: practiceCatalog = {
      subjects: [],
      chapters: [],
      tests: [],
      attempts: [],
      questionCounts: {},
    },
    isLoading: loadingCatalog,
    isError: catalogError,
    refetch: refetchCatalog,
  } = useQuery({
    queryKey: ['practice-catalog-v2', user?.id],
    queryFn: async () => {
      const [subjects, chapters, tests, attempts, questionCountsRes] = await Promise.all([
        api.getSubjects(),
        api.getAllChapters(),
        api.getTests(),
        user?.id ? api.getUserAttempts(user.id) : Promise.resolve([]),
        (async () => {
          if (!isSupabaseConfigured) return {};
          try {
            const { data } = await supabase
              .from('questions')
              .select('chapter_id')
              .eq('is_active', true);
            const map: Record<string, number> = {};
            if (data) {
              data.forEach((r) => {
                if (r.chapter_id) map[r.chapter_id] = (map[r.chapter_id] || 0) + 1;
              });
            }
            return map;
          } catch {
            return {};
          }
        })(),
      ]);
      return {
        subjects,
        chapters,
        tests,
        attempts,
        questionCounts: questionCountsRes as Record<string, number>,
      };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // 2. Revision data (Mistakes & Bookmarks)
  const { data: revision, isLoading: loadingRevision } = usePracticeRevision(user?.id);
  const mistakes = useMemo(() => revision?.mistakes ?? [], [revision]);
  const bookmarks = useMemo(() => revision?.bookmarks ?? [], [revision]);
  const pendingMistakes = useMemo(() => mistakes.filter((m) => !m.isResolved), [mistakes]);

  const resolveMistake = useResolveMistake(user?.id);
  const removeBookmark = useRemoveBookmark(user?.id);

  // Tab state
  const [activeTab, setActiveTab] = useState<PracticeTab>('dashboard');

  // Search, filter & sorting state
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    searchParams.get('subject') || 'all'
  );
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [selectedSort, setSelectedSort] = useState<'default' | 'tests' | 'questions' | 'alpha'>(
    'default'
  );
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Modal state when a topic has multiple tests
  const [selectedTopicForModal, setSelectedTopicForModal] = useState<EnrichedTopic | null>(null);

  // Notice modal when topic has no tests
  const [noTestNoticeTopic, setNoTestNoticeTopic] = useState<EnrichedTopic | null>(null);

  // List view state for mistakes / bookmarks
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedRevisionSubjectFilter, setSelectedRevisionSubjectFilter] = useState<string>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Interactive Practice Session state
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [practiceSource, setPracticeSource] = useState<'mistakes' | 'bookmarks'>('mistakes');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [sessionAnswers, setSessionAnswers] = useState<PracticeAnswerRecord[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const { isBilingualEnabled } = useContentLanguage();
  const [languageMode, setLanguageMode] = useState<'bengali' | 'english'>('bengali');

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync active tab with URL (?tab=mistakes|bookmarks)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const subjectParam = searchParams.get('subject');
    const qParam = searchParams.get('q');

    if (qParam !== null && qParam !== searchQuery) {
      setSearchQuery(qParam);
    }
    if (subjectParam && subjectParam !== selectedSubjectId) {
      setSelectedSubjectId(subjectParam);
    }

    if (tabParam === 'mistakes') {
      setActiveTab('mistakes');
    } else if (tabParam === 'bookmarks') {
      setActiveTab('bookmarks');
    } else {
      setActiveTab('dashboard');
    }
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tab: PracticeTab) => {
      setActiveTab(tab);
      setIsPracticing(false);
      setIsSessionComplete(false);
      const newParams = new URLSearchParams(searchParams);
      if (tab === 'dashboard') {
        newParams.delete('tab');
      } else {
        newParams.set('tab', tab);
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleSelectSubject = useCallback(
    (subjectId: string) => {
      setSelectedSubjectId(subjectId);
      const newParams = new URLSearchParams(searchParams);
      if (subjectId === 'all') {
        newParams.delete('subject');
      } else {
        newParams.set('subject', subjectId);
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleSearchChange = useCallback(
    (val: string) => {
      setSearchQuery(val);
      const newParams = new URLSearchParams(searchParams);
      if (val.trim()) {
        newParams.set('q', val.trim());
      } else {
        newParams.delete('q');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  // 3. Enrich topics with subjects, tests, and real question counts
  const enrichedTopics = useMemo<EnrichedTopic[]>(() => {
    const subjectsMap = new Map(practiceCatalog.subjects.map((s) => [s.id, s]));

    return practiceCatalog.chapters.map((ch) => {
      const parentSubject = subjectsMap.get(ch.subjectId);
      const chTests = practiceCatalog.tests.filter(
        (t) => t.chapterId === ch.id || t.topicId === ch.id
      );
      const testsCount = chTests.length;
      const dbQs = practiceCatalog.questionCounts?.[ch.id] || 0;
      const testQs = chTests.reduce((sum, t) => sum + (t.totalQuestions || 0), 0);
      const questionsCount = Math.max(dbQs, testQs) || (testsCount > 0 ? testsCount * 25 : 0);
      const hasFreeTest = chTests.some((t) => !t.isPremium);
      const hasProTest = chTests.some((t) => t.isPremium);

      return {
        ...ch,
        subject: parentSubject,
        subjectName: parentSubject?.name || 'General',
        tests: chTests,
        testsCount,
        questionsCount,
        hasFreeTest,
        hasProTest,
      };
    });
  }, [practiceCatalog]);

  // Total metrics
  const totalQuestionsAvailable = useMemo(() => {
    const fromTests = practiceCatalog.tests.reduce((sum, t) => sum + (t.totalQuestions || 0), 0);
    const fromQuestionBank = Object.values(practiceCatalog.questionCounts || {}).reduce(
      (sum, c) => sum + c,
      0
    );
    return Math.max(fromTests, fromQuestionBank) || 2500;
  }, [practiceCatalog]);

  // Filtered and sorted topics
  const filteredTopics = useMemo(() => {
    let list = enrichedTopics.filter((item) => {
      // 1. Subject filter
      if (selectedSubjectId !== 'all' && item.subjectId !== selectedSubjectId) {
        return false;
      }
      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSubj = item.subjectName.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchName && !matchSubj && !matchDesc) return false;
      }
      // 3. Plan filter
      if (planFilter === 'free' && !item.hasFreeTest) return false;
      if (planFilter === 'pro' && !item.hasProTest) return false;

      return true;
    });

    // Sort
    if (selectedSort === 'tests') {
      list = [...list].sort((a, b) => b.testsCount - a.testsCount);
    } else if (selectedSort === 'questions') {
      list = [...list].sort((a, b) => b.questionsCount - a.questionsCount);
    } else if (selectedSort === 'alpha') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => a.orderIndex - b.orderIndex);
    }

    return list;
  }, [enrichedTopics, selectedSubjectId, searchQuery, planFilter, selectedSort]);

  // In-progress attempts for "Continue Your Practice"
  const inProgressAttempts = useMemo(() => {
    return practiceCatalog.attempts.filter((a) => a.status === 'in_progress');
  }, [practiceCatalog.attempts]);

  // Action: Start Topic Test
  const handleStartTopic = useCallback(
    (topic: EnrichedTopic) => {
      if (topic.tests.length === 1) {
        const test = topic.tests[0];
        const canAccess = !test.isPremium || isPro || isAdmin || hasAccessToTest(test.isPremium);
        if (!canAccess) {
          navigate('/subscription');
        } else {
          navigate(`/exams/${test.id}`);
        }
      } else if (topic.tests.length > 1) {
        setSelectedTopicForModal(topic);
      } else {
        setNoTestNoticeTopic(topic);
      }
    },
    [isPro, isAdmin, hasAccessToTest, navigate]
  );

  // Revision helpers
  const availableRevisionSubjects = useMemo(() => {
    const activeList =
      activeTab === 'mistakes' ? mistakes : activeTab === 'bookmarks' ? bookmarks : [];
    const set = new Set<string>();
    activeList.forEach((item) => {
      if (item.subjectName) set.add(item.subjectName);
    });
    return Array.from(set);
  }, [activeTab, mistakes, bookmarks]);

  const filteredMistakes = useMemo(() => {
    if (selectedRevisionSubjectFilter === 'all') return mistakes;
    return mistakes.filter((m) => m.subjectName === selectedRevisionSubjectFilter);
  }, [mistakes, selectedRevisionSubjectFilter]);

  const filteredBookmarks = useMemo(() => {
    if (selectedRevisionSubjectFilter === 'all') return bookmarks;
    return bookmarks.filter((b) => b.subjectName === selectedRevisionSubjectFilter);
  }, [bookmarks, selectedRevisionSubjectFilter]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleToggleResolve = async (mistakeId: string, currentResolvedState: boolean) => {
    setResolvingId(mistakeId);
    try {
      await resolveMistake.mutateAsync({ mistakeId, nextState: !currentResolvedState });
    } catch (err) {
      console.error('Failed to update mistake resolution:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleRemoveBookmarkItem = async (bookmarkId: string, questionId: string) => {
    if (!user) return;
    try {
      await removeBookmark.mutateAsync({ bookmarkId, questionId });
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };

  // Interactive practice session runner
  const startPracticeSession = (source: 'mistakes' | 'bookmarks') => {
    const list =
      source === 'mistakes'
        ? filteredMistakes.filter((m) => !m.isResolved).map((m) => m.question)
        : filteredBookmarks.map((b) => b.question);

    if (list.length === 0) return;

    setPracticeSource(source);
    setPracticeQuestions(list);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setSessionAnswers([]);
    setIsSessionComplete(false);
    setIsPracticing(true);
  };

  const currentQuestion = practiceQuestions[currentIndex];

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctOption;
    setIsAnswerSubmitted(true);

    setSessionAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedOption,
        isCorrect,
      },
    ]);

    if (practiceSource === 'mistakes' && isCorrect) {
      const foundMistake = mistakes.find((m) => m.questionId === currentQuestion.id);
      if (foundMistake && !foundMistake.isResolved) {
        handleToggleResolve(foundMistake.id, false);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < practiceQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsSessionComplete(true);
    }
  };

  const handleExitPractice = () => {
    setIsPracticing(false);
    setIsSessionComplete(false);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setSessionAnswers([]);
  };

  const sessionTotal = sessionAnswers.length;
  const sessionCorrect = sessionAnswers.filter((a) => a.isCorrect).length;
  const sessionWrong = sessionTotal - sessionCorrect;
  const sessionAccuracy =
    sessionTotal > 0 ? ((sessionCorrect / sessionTotal) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 pb-16 antialiased pk-student-page">
      {/* =========================================================================
          PRACTICE MODE: INTERACTIVE WORKSPACE (When practicing mistakes/bookmarks)
          ========================================================================= */}
      {isPracticing && !isSessionComplete && currentQuestion && (
        <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0158FC]">
                  {practiceSource === 'mistakes' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-[#0158FC]" />
                  )}
                </span>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {practiceSource === 'mistakes' ? 'Mistakes Revision' : 'Bookmark Practice'}
                  </h2>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    Question {currentIndex + 1} of {practiceQuestions.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isBilingualEnabled && (
                  <button
                    type="button"
                    onClick={() =>
                      setLanguageMode((prev) => (prev === 'bengali' ? 'english' : 'bengali'))
                    }
                    className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
                  >
                    <Languages className="w-3.5 h-3.5 text-[#0158FC]" />
                    <span>{languageMode === 'bengali' ? 'বাংলা' : 'English'}</span>
                  </button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExitPractice}
                  className="font-bold text-xs h-8"
                >
                  Exit Drill
                </Button>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0158FC] h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentIndex + 1) / practiceQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <Card className="p-5 sm:p-7 border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0158FC] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                Question #{currentIndex + 1}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                <MathText>
                  {languageMode === 'english'
                    ? currentQuestion.questionText
                    : currentQuestion.questionBengaliText || currentQuestion.questionText}
                </MathText>
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optText = String(currentQuestion[`option${opt}` as keyof Question] || '');
                const isSelected = selectedOption === opt;
                const isCorrectOption = currentQuestion.correctOption === opt;

                let stateStyles =
                  'border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-white dark:bg-slate-900';
                if (isAnswerSubmitted) {
                  if (isCorrectOption) {
                    stateStyles =
                      'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200';
                  } else if (isSelected && !isCorrectOption) {
                    stateStyles =
                      'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200';
                  }
                } else if (isSelected) {
                  stateStyles =
                    'border-[#0158FC] bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-[#0158FC]';
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full p-3.5 sm:p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${stateStyles}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${
                        isAnswerSubmitted && isCorrectOption
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isAnswerSubmitted && isSelected && !isCorrectOption
                            ? 'bg-rose-600 text-white border-rose-600'
                            : isSelected
                              ? 'bg-[#0158FC] text-white border-[#0158FC]'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {opt}
                    </span>
                    <span className="text-sm font-medium pt-0.5 flex-1">
                      <MathText>{optText}</MathText>
                    </span>

                    {isAnswerSubmitted && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {isAnswerSubmitted && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                <div
                  className={`p-3 rounded-xl flex items-center gap-2.5 font-bold text-xs ${
                    selectedOption === currentQuestion.correctOption
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {selectedOption === currentQuestion.correctOption ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Correct! You identified the right answer.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                      <span>
                        Incorrect. The correct answer is{' '}
                        <strong>Option {currentQuestion.correctOption}</strong>.
                      </span>
                    </>
                  )}
                </div>

                <ShortNotesBox
                  explanation={currentQuestion.explanationBengali || currentQuestion.explanation}
                  isMathematics={isMathematicsQuestion(currentQuestion)}
                  title={
                    isMathematicsQuestion(currentQuestion)
                      ? undefined
                      : !isBilingualEnabled
                        ? 'শর্ট নোটস'
                        : 'শর্ট নোটস (Short Notes)'
                  }
                  defaultExpanded={true}
                  collapsible={false}
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                {isAnswerSubmitted
                  ? currentIndex < practiceQuestions.length - 1
                    ? 'Review explanation and proceed'
                    : 'Last question in session'
                  : 'Select an option to check your answer'}
              </span>

              {!isAnswerSubmitted ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption}
                  className="font-bold text-xs sm:text-sm px-5"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="font-bold text-xs sm:text-sm px-5"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {currentIndex < practiceQuestions.length - 1
                    ? 'Next Question'
                    : 'Finish Practice'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          PRACTICE SESSION RESULTS SUMMARY
          ========================================================================= */}
      {isPracticing && isSessionComplete && (
        <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <Card className="p-6 sm:p-8 text-center border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-800">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Practice Session Complete!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Here are your verified analytics for this revision drill:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Practiced</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {sessionTotal}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <p className="text-[10px] uppercase font-bold text-emerald-600">Correct</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{sessionCorrect}</p>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/60">
                <p className="text-[10px] uppercase font-bold text-rose-600">Wrong</p>
                <p className="text-xl font-black text-rose-600 mt-0.5">{sessionWrong}</p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60">
                <p className="text-[10px] uppercase font-bold text-[#0158FC]">Accuracy</p>
                <p className="text-xl font-black text-blue-950 dark:text-blue-300 mt-0.5">
                  {sessionAccuracy}%
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-4">
              <Button
                variant="outline"
                onClick={() => startPracticeSession(practiceSource)}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="w-full sm:w-auto font-bold text-xs"
              >
                Practice Again
              </Button>
              <Button onClick={handleExitPractice} className="w-full sm:w-auto font-bold text-xs">
                Back to Practice Hub
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          MAIN VIEWS (When not in interactive practice session)
          ========================================================================= */}
      {!isPracticing && (
        <>
          {/* ── 1. PAGE HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <PageHeader
              eyebrow="Chapter & Topic Practice"
              title="Practice Hub"
              subtitle="Master individual chapters with targeted syllabus tests, concept drills, and revision."
              icon={Zap}
              onBack={activeTab !== 'dashboard' ? () => handleTabChange('dashboard') : undefined}
            />

            {/* Quick Access Badges for Mistakes & Bookmarks */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleTabChange(activeTab === 'mistakes' ? 'dashboard' : 'mistakes')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer',
                  activeTab === 'mistakes'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-rose-50 hover:bg-rose-100 border-rose-200/80 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mistakes</span>
                {pendingMistakes.length > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                      activeTab === 'mistakes'
                        ? 'bg-white text-rose-700'
                        : 'bg-rose-600 text-white'
                    )}
                  >
                    {pendingMistakes.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleTabChange(activeTab === 'bookmarks' ? 'dashboard' : 'bookmarks')
                }
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer',
                  activeTab === 'bookmarks'
                    ? 'bg-[#026BFC] text-white border-[#026BFC] shadow-sm'
                    : 'bg-blue-50 hover:bg-blue-100 border-blue-200/80 text-[#026BFC] dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300'
                )}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved</span>
                {bookmarks.length > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                      activeTab === 'bookmarks'
                        ? 'bg-white text-[#026BFC]'
                        : 'bg-[#026BFC] text-white'
                    )}
                  >
                    {bookmarks.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* =====================================================================
              VIEW 1: REDESIGNED MODERN PRACTICE HUB (Main View)
              ===================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* ── 2. SUMMARY STRIP (Consistent with Test Series & Home standard) ── */}
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121A4D] via-[#1E2A8A] to-[#3142D6] text-white p-5 sm:p-7 shadow-sm">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute right-24 -bottom-20 w-48 h-48 rounded-full bg-[#4F7BFF]/30 blur-2xl"
                  aria-hidden="true"
                />
                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="max-w-xl space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-xs">
                      <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                      <span>Syllabus-Aligned Chapter Tests</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                      Consistent Chapter Practice,
                      <br />
                      Guaranteed Score Improvement!
                    </h2>
                    <p className="text-xs sm:text-sm text-white/80 font-medium max-w-lg leading-relaxed">
                      Reinforce every chapter with topic tests, check instant explanations in
                      Bengali & English, and track your conceptual clarity.
                    </p>
                  </div>

                  {/* Summary Metric Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 lg:w-[480px]">
                    {[
                      {
                        label: 'Subjects',
                        value: loadingCatalog ? '–' : practiceCatalog.subjects.length,
                        icon: BookOpen,
                      },
                      {
                        label: 'Topics',
                        value: loadingCatalog ? '–' : practiceCatalog.chapters.length,
                        icon: Layers,
                      },
                      {
                        label: 'Topic Tests',
                        value: loadingCatalog ? '–' : practiceCatalog.tests.length,
                        icon: FileCheck,
                      },
                      {
                        label: 'Questions',
                        value: loadingCatalog
                          ? '–'
                          : `${totalQuestionsAvailable.toLocaleString('en-IN')}+`,
                        icon: Target,
                      },
                    ].map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div
                          key={stat.label}
                          className="rounded-2xl bg-white/10 border border-white/15 px-3 py-3 text-center flex flex-col items-center justify-center backdrop-blur-xs"
                        >
                          <div className="flex items-center gap-1.5 text-white/90">
                            <Icon className="w-3.5 h-3.5 text-blue-200" />
                            <p className="text-lg sm:text-xl font-black leading-none">{stat.value}</p>
                          </div>
                          <p className="mt-1 text-[11px] font-semibold text-white/70">
                            {stat.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* ── 3. CONTINUE YOUR PRACTICE (Active attempt resuming) ── */}
              {inProgressAttempts.length > 0 && (
                <section className="space-y-3">
                  <SectionTitle
                    title="Continue Your Practice"
                    subtitle="Resume your unfinished tests where you left off"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {inProgressAttempts.slice(0, 2).map((att) => {
                      const answered =
                        (att.correctCount || 0) + (att.wrongCount || 0) + (att.skippedCount || 0);
                      const total = att.totalQuestions || 25;
                      const pct = Math.min(100, Math.round((answered / total) * 100));

                      return (
                        <div
                          key={att.id}
                          className={cn(
                            studentCard,
                            'p-4 sm:p-5 flex flex-col justify-between gap-3 border border-blue-200/80 dark:border-blue-900/60 shadow-xs'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#026BFC] flex items-center justify-center shrink-0 border border-blue-200/60">
                                <RotateCcw className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-black text-[#0B1B3F] dark:text-white truncate">
                                  {att.testTitle || 'Topic Test in Progress'}
                                </h4>
                                <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                                  {att.examTitle || att.subjectName || 'Chapter-wise Practice'}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-[#026BFC] shrink-0">
                              {pct}%
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                              <span>
                                {answered}/{total} Questions answered
                              </span>
                              <span>In progress</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#026BFC] transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/exams/${att.testId}/runner?attemptId=${att.id}`)
                              }
                              className="h-9 px-4 rounded-xl bg-[#026BFC] hover:bg-[#025bd6] text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <span>Continue Test</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── 4. SEARCH & FILTER TOOLBAR ── */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search subjects, topics, or chapters..."
                      aria-label="Search practice topics"
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#026BFC]/60 focus:ring-4 focus:ring-[#026BFC]/10 transition-all shadow-2xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => handleSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Plan / Access Filter Pills */}
                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPlanFilter('all')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer',
                        planFilter === 'all'
                          ? 'bg-white dark:bg-slate-900 text-[#026BFC] shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      )}
                    >
                      All Topics
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanFilter('free')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer',
                        planFilter === 'free'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      )}
                    >
                      Free Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanFilter('pro')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer',
                        planFilter === 'pro'
                          ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      )}
                    >
                      Pro Pass
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative shrink-0" ref={sortDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                      className="h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#026BFC]/40 flex items-center justify-between gap-2 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span className="text-slate-400 font-semibold">Sort:</span>
                      <span>
                        {selectedSort === 'default'
                          ? 'Syllabus Order'
                          : selectedSort === 'tests'
                            ? 'Most Tests'
                            : selectedSort === 'questions'
                              ? 'Most Questions'
                              : 'A–Z'}
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 transition-transform text-slate-400',
                          isSortDropdownOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    {isSortDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 overflow-hidden py-1">
                        {[
                          { id: 'default', label: 'Syllabus Order' },
                          { id: 'tests', label: 'Most Tests' },
                          { id: 'questions', label: 'Most Questions' },
                          { id: 'alpha', label: 'A–Z Title' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSelectedSort(opt.id as any);
                              setIsSortDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                              selectedSort === opt.id
                                ? 'text-[#026BFC]'
                                : 'text-slate-700 dark:text-slate-300'
                            )}
                          >
                            <span>{opt.label}</span>
                            {selectedSort === opt.id && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 5. SUBJECT FILTER CHIPS (Horizontal Scrollable) ── */}
                <div
                  className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1"
                  role="group"
                  aria-label="Filter by subject"
                >
                  <FilterChip
                    active={selectedSubjectId === 'all'}
                    onClick={() => handleSelectSubject('all')}
                  >
                    <span>All Subjects</span>
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                      {enrichedTopics.length}
                    </span>
                  </FilterChip>

                  {practiceCatalog.subjects.map((sub) => {
                    const theme = getSubjectTheme(sub.name);
                    const SubIcon = theme.icon;
                    const subTopicCount = enrichedTopics.filter(
                      (t) => t.subjectId === sub.id
                    ).length;

                    return (
                      <FilterChip
                        key={sub.id}
                        active={selectedSubjectId === sub.id}
                        onClick={() => handleSelectSubject(sub.id)}
                      >
                        <span className="flex items-center gap-1.5">
                          <SubIcon className="w-3.5 h-3.5" />
                          <span>{sub.name}</span>
                          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                            {subTopicCount}
                          </span>
                        </span>
                      </FilterChip>
                    );
                  })}
                </div>
              </div>

              {/* ── 6. TOPICS SECTION HEADING & COUNTER ── */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0B1B3F] dark:text-white tracking-tight">
                    {selectedSubjectId === 'all'
                      ? 'All Practice Topics'
                      : practiceCatalog.subjects.find((s) => s.id === selectedSubjectId)?.name ||
                        'Subject Topics'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Showing <span className="font-extrabold text-[#0B1B3F] dark:text-white">{filteredTopics.length}</span>{' '}
                    {filteredTopics.length === 1 ? 'topic' : 'topics'} available for practice
                  </p>
                </div>

                {(searchQuery || selectedSubjectId !== 'all' || planFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSubjectId('all');
                      setPlanFilter('all');
                      setSearchParams({});
                    }}
                    className="text-xs font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* ── 7. TOPICS GRID / STATES ── */}
              {catalogError ? (
                <StudentLoadError
                  message="Could not load practice catalog from the database. Please check your internet connection."
                  onRetry={() => void refetchCatalog()}
                />
              ) : loadingCatalog ? (
                <StudentLoading label="Loading syllabus topics & chapter tests" />
              ) : filteredTopics.length === 0 ? (
                <div className={cn(studentCard, 'py-14 px-6 text-center space-y-3.5')}>
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-[#026BFC]">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-black text-[#0B1B3F] dark:text-white">
                    No topics found matching your criteria
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    {searchQuery
                      ? `We couldn't find any chapter tests matching "${searchQuery}". Try a different keyword or clear the search.`
                      : 'No topics are available for the selected subject filter. Try selecting "All Subjects".'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSubjectId('all');
                      setPlanFilter('all');
                      setSearchParams({});
                    }}
                    className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[#026BFC] hover:bg-[#025bd6] text-white text-xs font-black transition-all cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {filteredTopics.map((topic) => {
                    const subjectTheme = getSubjectTheme(topic.subjectName);
                    const SubjectIcon = subjectTheme.icon;

                    return (
                      <div
                        key={topic.id}
                        className={cn(
                          studentCard,
                          'p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_28px_-10px_rgba(2,107,252,0.18)] transition-all duration-200 group border border-slate-200/80 dark:border-slate-800'
                        )}
                      >
                        <div>
                          {/* Card Top: Subject pill & Pro/Free badges */}
                          <div className="flex items-center justify-between gap-2 mb-3.5">
                            <span
                              className={cn(
                                'px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide',
                                subjectTheme.badgeBg
                              )}
                            >
                              {topic.subjectName}
                            </span>

                            {topic.hasProTest ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300">
                                <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                Pro Pass
                              </span>
                            ) : topic.hasFreeTest ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Free Mock
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">
                                Chapter Test
                              </span>
                            )}
                          </div>

                          {/* Card Core: Icon + Title + Description */}
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs',
                                subjectTheme.bgColor,
                                subjectTheme.color,
                                subjectTheme.borderColor
                              )}
                            >
                              {topic.iconName &&
                              (topic.iconName.startsWith('http') ||
                                topic.iconName.startsWith('/')) ? (
                                <img
                                  src={topic.iconName}
                                  alt={topic.name}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <SubjectIcon className="w-5 h-5 stroke-[2.2]" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-[15px] font-extrabold text-[#0B1B3F] dark:text-white leading-snug group-hover:text-[#026BFC] transition-colors line-clamp-2">
                                {topic.name}
                              </h4>
                              {topic.description ? (
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">
                                  {topic.description}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-slate-400 italic">
                                  Comprehensive syllabus topic practice drill.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom: Metadata & Action CTA */}
                        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              {topic.testsCount > 0
                                ? `${topic.testsCount} ${topic.testsCount === 1 ? 'Topic Test' : 'Topic Tests'}`
                                : 'Concept Mocks'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-slate-400" />
                              {topic.questionsCount > 0
                                ? `${topic.questionsCount} Questions`
                                : 'Syllabus Questions'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartTopic(topic)}
                            className="w-full h-10 rounded-xl bg-[#026BFC] hover:bg-[#025bd6] text-white text-xs font-black flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(2,107,252,0.25)] transition-all cursor-pointer transform active:scale-[0.98]"
                          >
                            <span>
                              {topic.testsCount > 1
                                ? `Choose Test (${topic.testsCount})`
                                : topic.testsCount === 1
                                  ? 'Start Topic Test'
                                  : 'Practice Chapter'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              VIEW 2: MISTAKES NOTEBOOK (Deep-linked or toggled via Mistakes chip)
              ===================================================================== */}
          {activeTab === 'mistakes' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-rose-950 dark:text-rose-200 leading-relaxed">
                    <strong className="font-extrabold text-sm block mb-0.5">
                      Automated Mistakes Notebook
                    </strong>
                    Questions answered incorrectly during any mock test are auto-collected here.
                    Revise each question with short notes to master recurring exam concepts.
                  </div>
                </div>

                {pendingMistakes.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => startPracticeSession('mistakes')}
                    className="font-black text-xs shrink-0 self-stretch sm:self-auto bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                    leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
                  >
                    Practice Mistakes ({pendingMistakes.length})
                  </Button>
                )}
              </div>

              {/* Subject filter for mistakes */}
              {availableRevisionSubjects.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                  <span className="text-slate-400 text-[11px] font-bold shrink-0">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRevisionSubjectFilter('all')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border',
                      selectedRevisionSubjectFilter === 'all'
                        ? 'bg-[#026BFC] text-white border-[#026BFC]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    All Subjects
                  </button>
                  {availableRevisionSubjects.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSelectedRevisionSubjectFilter(subj)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border',
                        selectedRevisionSubjectFilter === subj
                          ? 'bg-[#026BFC] text-white border-[#026BFC]'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      )}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              )}

              {loadingRevision ? (
                <StudentLoading label="Loading mistakes notebook" />
              ) : filteredMistakes.length === 0 ? (
                <Card className="p-10 text-center border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base sm:text-lg font-black text-[#0B1B3F] dark:text-white">
                    You don&apos;t have any mistakes to revise right now!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    Every question you answer incorrectly in mock tests is automatically recorded
                    here so you can revise and resolve them.
                  </p>
                  <Button
                    onClick={() => handleTabChange('dashboard')}
                    className="mt-4 font-black text-xs sm:text-sm shadow-xs bg-[#026BFC] text-white"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Start a Topic Test
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredMistakes.map((item, idx) => {
                    const q = item.question;
                    const isExpanded = expandedId === item.id;

                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          'p-5 transition-all border shadow-xs',
                          item.isResolved
                            ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                            : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-400 uppercase">
                                Question #{idx + 1}
                              </span>
                              <Badge variant="warning" size="sm" className="text-[10px]">
                                Wrong {item.wrongCount}x
                              </Badge>
                              {item.isResolved ? (
                                <Badge variant="success" size="sm" className="text-[10px]">
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge variant="outline" size="sm" className="text-[10px]">
                                  Pending
                                </Badge>
                              )}
                              {item.subjectName && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  {item.subjectName}
                                </span>
                              )}
                              {item.chapterName && (
                                <span className="text-[10px] text-slate-400">
                                  {item.chapterName}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-0.5">
                              {!isBilingualEnabled
                                ? q.questionBengaliText || q.questionText
                                : q.questionText}
                            </h3>
                            {isBilingualEnabled && q.questionBengaliText && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                {q.questionBengaliText}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                                const optKey = `option${opt}` as keyof Question;
                                const isCorrect = q.correctOption === opt;
                                return (
                                  <div
                                    key={opt}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                      isCorrect
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-semibold'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-current flex items-center justify-center font-bold text-[10px]">
                                      {opt}
                                    </span>
                                    <span>{String(q[optKey])}</span>
                                  </div>
                                );
                              })}
                            </div>

                            <ShortNotesBox
                              explanation={q.explanationBengali || q.explanation}
                              isMathematics={isMathematicsQuestion(q)}
                              title={
                                isMathematicsQuestion(q) ? undefined : 'শর্ট নোটস (Short Notes)'
                              }
                              defaultExpanded={true}
                              collapsible={false}
                            />

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                size="sm"
                                variant={item.isResolved ? 'outline' : 'primary'}
                                disabled={resolvingId === item.id}
                                onClick={() => handleToggleResolve(item.id, item.isResolved)}
                                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                                className="text-xs font-bold"
                              >
                                {item.isResolved
                                  ? 'Mark as Unresolved'
                                  : 'Mark as Understood & Resolved'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              VIEW 3: SAVED QUESTIONS (Bookmarks)
              ===================================================================== */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#026BFC] flex items-center justify-center shrink-0">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
                    <strong className="font-extrabold text-sm block mb-0.5">
                      Bookmarked Questions
                    </strong>
                    High-yield questions saved during practice tests. Re-visit these questions to
                    keep tricky formulas, facts, and shortcuts fresh.
                  </div>
                </div>

                {bookmarks.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => startPracticeSession('bookmarks')}
                    className="font-black text-xs shrink-0 self-stretch sm:self-auto bg-[#026BFC] text-white shadow-xs"
                    leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
                  >
                    Practice Bookmarks ({bookmarks.length})
                  </Button>
                )}
              </div>

              {availableRevisionSubjects.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                  <span className="text-slate-400 text-[11px] font-bold shrink-0">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRevisionSubjectFilter('all')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border',
                      selectedRevisionSubjectFilter === 'all'
                        ? 'bg-[#026BFC] text-white border-[#026BFC]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    All Subjects
                  </button>
                  {availableRevisionSubjects.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSelectedRevisionSubjectFilter(subj)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border',
                        selectedRevisionSubjectFilter === subj
                          ? 'bg-[#026BFC] text-white border-[#026BFC]'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      )}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              )}

              {loadingRevision ? (
                <StudentLoading label="Loading bookmarked questions" />
              ) : filteredBookmarks.length === 0 ? (
                <Card className="p-10 text-center border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base sm:text-lg font-black text-[#0B1B3F] dark:text-white">
                    No bookmarked questions saved yet!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    While practicing topic tests, click the bookmark icon to save important
                    questions here for quick revision.
                  </p>
                  <Button
                    onClick={() => handleTabChange('dashboard')}
                    className="mt-4 font-black text-xs sm:text-sm shadow-xs bg-[#026BFC] text-white"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Browse Topic Tests
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredBookmarks.map((bm, idx) => {
                    const q = bm.question;
                    const isExpanded = expandedId === bm.id;

                    return (
                      <Card
                        key={bm.id}
                        className="p-5 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="info" size="sm" className="text-[10px]">
                                Bookmark #{idx + 1}
                              </Badge>
                              {bm.subjectName && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  {bm.subjectName}
                                </span>
                              )}
                              {bm.chapterName && (
                                <span className="text-[10px] text-slate-400">{bm.chapterName}</span>
                              )}
                              <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                                {new Date(bm.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-0.5">
                              {!isBilingualEnabled
                                ? q.questionBengaliText || q.questionText
                                : q.questionText}
                            </h3>
                            {isBilingualEnabled && q.questionBengaliText && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                {q.questionBengaliText}
                              </p>
                            )}

                            {bm.note && (
                              <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-lg text-xs text-amber-900 dark:text-amber-200 mt-2">
                                <span className="font-bold">Student Note:</span> {bm.note}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveBookmarkItem(bm.id, bm.questionId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Remove Bookmark"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleExpand(bm.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                                const optKey = `option${opt}` as keyof Question;
                                const isCorrect = q.correctOption === opt;
                                return (
                                  <div
                                    key={opt}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                      isCorrect
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-semibold'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-current flex items-center justify-center font-bold text-[10px]">
                                      {opt}
                                    </span>
                                    <span>{String(q[optKey])}</span>
                                  </div>
                                );
                              })}
                            </div>

                            <ShortNotesBox
                              explanation={q.explanationBengali || q.explanation}
                              isMathematics={isMathematicsQuestion(q)}
                              title={
                                isMathematicsQuestion(q) ? undefined : 'শর্ট নোটস (Short Notes)'
                              }
                              defaultExpanded={true}
                              collapsible={false}
                            />
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          TOPIC TESTS PICKER MODAL (When topic has multiple mock tests)
          ========================================================================= */}
      {selectedTopicForModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedTopicForModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-[#026BFC] border border-blue-200/60">
                    {selectedTopicForModal.subjectName}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {selectedTopicForModal.tests.length} Tests Available
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#0B1B3F] dark:text-white">
                  {selectedTopicForModal.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose a chapter test to start your practice session:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopicForModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Cards List */}
            <div className="space-y-3">
              {selectedTopicForModal.tests.map((test) => {
                const isAccessible =
                  !test.isPremium || isPro || isAdmin || hasAccessToTest(test.isPremium);

                return (
                  <div
                    key={test.id}
                    className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#026BFC]/40 transition-all"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-[#0B1B3F] dark:text-white">
                          {test.title}
                        </h4>
                        {test.isPremium ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                            <Crown className="w-2.5 h-2.5" />
                            PRO
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                            FREE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-slate-400" />
                          {test.totalQuestions} Questions
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {test.durationMinutes} Mins
                        </span>
                        <span>•</span>
                        <span>{test.totalMarks} Marks</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-end">
                      {isAccessible ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTopicForModal(null);
                            navigate(`/exams/${test.id}`);
                          }}
                          className="h-9 px-4 rounded-xl bg-[#026BFC] hover:bg-[#025bd6] text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <span>Start Test</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTopicForModal(null);
                            navigate('/subscription');
                          }}
                          className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>Unlock Pro</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          COMING SOON NOTICE MODAL (When topic has no published tests yet)
          ========================================================================= */}
      {noTestNoticeTopic && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setNoTestNoticeTopic(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#026BFC] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-[#026BFC] border border-blue-200/60">
                {noTestNoticeTopic.subjectName}
              </span>
              <h3 className="mt-2 text-lg font-black text-[#0B1B3F] dark:text-white">
                {noTestNoticeTopic.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Dedicated mock tests for this topic are currently being curated by our faculty team.
                In the meantime, you can practice other available chapter tests or take a full exam mock!
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNoTestNoticeTopic(null)}
                className="font-bold text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setNoTestNoticeTopic(null);
                  navigate('/test-series');
                }}
                className="font-black text-xs bg-[#026BFC] text-white"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Explore Test Series
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
