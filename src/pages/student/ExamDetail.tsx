import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Lock,
  Play,
  Award,
  History,
  BookOpen,
  Crown,
  FileCheck2,
  Calendar,
  Layers,
} from 'lucide-react';
import type { MockTest, Subject, Chapter, TestSeries } from '@/types';

type ExamTab = 'full-mock' | 'pyq' | 'topic-tests';

export const ExamDetail: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { user, isPro } = useAuth();
  const { exams, selectedExam, setSelectedExam } = useExam();

  // Find active exam
  const currentExam = useMemo(() => {
    return exams.find((e) => e.id === examId || e.slug === examId) || selectedExam;
  }, [exams, examId, selectedExam]);

  // Keep ExamContext in sync
  useEffect(() => {
    if (currentExam && selectedExam?.id !== currentExam.id) {
      setSelectedExam(currentExam);
    }
  }, [currentExam, selectedExam, setSelectedExam]);

  // Active Tab: from URL pathname, search params, or default to full-mock
  const pathTab = location.pathname.endsWith('/pyq')
    ? 'pyq'
    : location.pathname.endsWith('/topic-tests')
      ? 'topic-tests'
      : location.pathname.endsWith('/full-mock')
        ? 'full-mock'
        : null;
  const tabParam = (searchParams.get('tab') as ExamTab) || pathTab;
  const [activeTab, setActiveTab] = useState<ExamTab>(
    tabParam === 'pyq' || tabParam === 'topic-tests' ? tabParam : 'full-mock'
  );

  const handleTabChange = (tab: ExamTab) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };

  // Tests & Content state
  const [loading, setLoading] = useState(true);
  const [fullMockTests, setFullMockTests] = useState<MockTest[]>([]);
  const [pyqTests, setPyqTests] = useState<MockTest[]>([]);
  const [topicTests, setTopicTests] = useState<MockTest[]>([]);
  const [testSeriesList, setTestSeriesList] = useState<TestSeries[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examSubjectsWithTopics, setExamSubjectsWithTopics] = useState<
    { subject: Subject; topics: Chapter[] }[]
  >([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Series Selection state
  const seriesParam = searchParams.get('seriesId');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(seriesParam || 'all');

  useEffect(() => {
    if (seriesParam) {
      setSelectedSeriesId(seriesParam);
    } else {
      setSelectedSeriesId('all');
    }
  }, [seriesParam]);

  const handleSeriesSelect = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    const newParams = new URLSearchParams(searchParams);
    if (seriesId === 'all') {
      newParams.delete('seriesId');
    } else {
      newParams.set('seriesId', seriesId);
    }
    setSearchParams(newParams);
  };

  // Locked test modal state
  const [selectedLockedTest, setSelectedLockedTest] = useState<MockTest | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);

  // Load all tests, test series, and mapped topics for this exam
  useEffect(() => {
    async function loadExamData() {
      if (!currentExam) return;
      setLoading(true);
      try {
        const [fullMocks, pyqs, topics, subList, mappedSubjects, series] = await Promise.all([
          api.getTestsForExam(currentExam.id, 'full_mock'),
          api.getTestsForExam(currentExam.id, 'pyq'),
          api.getTestsForExam(currentExam.id, 'topic'),
          api.getSubjects(currentExam.id),
          api.getExamSubjectsWithTopics(currentExam.id),
          api.getTestSeries(currentExam.id).catch(() => []),
        ]);

        setFullMockTests(fullMocks);
        setPyqTests(pyqs);
        setTopicTests(topics);
        setSubjects(mappedSubjects.length > 0 ? mappedSubjects.map((m) => m.subject) : subList);
        setExamSubjectsWithTopics(mappedSubjects);
        setTestSeriesList(series || []);
      } catch (err) {
        console.error('Failed to load tests for exam:', err);
      } finally {
        setLoading(false);
      }
    }

    loadExamData();
  }, [currentExam]);

  // Lookup helper for active series
  const activeSeries = useMemo(() => {
    if (selectedSeriesId === 'all') return null;
    return testSeriesList.find((s) => s.id === selectedSeriesId) || null;
  }, [testSeriesList, selectedSeriesId]);

  // Lookup map of testSeriesId -> TestSeries
  const seriesMap = useMemo(() => {
    const map = new Map<string, TestSeries>();
    testSeriesList.forEach((s) => map.set(s.id, s));
    return map;
  }, [testSeriesList]);

  // Extract available years for PYQ tab
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    pyqTests.forEach((t) => {
      if (t.year) years.add(t.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [pyqTests]);

  // Filtered Full Mock tests (scoped to selected series if active)
  const displayedFullMockTests = useMemo(() => {
    if (selectedSeriesId === 'all') return fullMockTests;
    return fullMockTests.filter((t) => t.testSeriesId === selectedSeriesId);
  }, [fullMockTests, selectedSeriesId]);

  // Filtered PYQ tests (scoped to selected year & series if active)
  const displayedPyqTests = useMemo(() => {
    let list = pyqTests;
    if (selectedYear !== 'all') {
      list = list.filter((t) => t.year?.toString() === selectedYear);
    }
    if (selectedSeriesId !== 'all') {
      list = list.filter((t) => t.testSeriesId === selectedSeriesId);
    }
    return list;
  }, [pyqTests, selectedYear, selectedSeriesId]);

  // Filtered Topic tests (scoped to selected subject & series if active)
  const displayedTopicTests = useMemo(() => {
    let list = topicTests;
    if (selectedSubjectId !== 'all') {
      list = list.filter((t) => t.subjectId === selectedSubjectId);
    }
    if (selectedSeriesId !== 'all') {
      list = list.filter((t) => t.testSeriesId === selectedSeriesId);
    }
    return list;
  }, [topicTests, selectedSubjectId, selectedSeriesId]);

  const visibleSubjectGroups = useMemo(() => {
    if (selectedSubjectId === 'all') return examSubjectsWithTopics;
    return examSubjectsWithTopics.filter((item) => item.subject.id === selectedSubjectId);
  }, [examSubjectsWithTopics, selectedSubjectId]);

  const handleTestClick = (test: MockTest) => {
    const isLocked = test.isPremium && !isPro && user?.role !== 'admin';
    if (isLocked) {
      setSelectedLockedTest(test);
      setShowSubscriptionModal(true);
      return;
    }
    navigate(`/exams/${test.id}`);
  };

  const handleStartRunner = async (test: MockTest, e: React.MouseEvent) => {
    e.stopPropagation();
    const isLocked = test.isPremium && !isPro && user?.role !== 'admin';
    if (isLocked) {
      setSelectedLockedTest(test);
      setShowSubscriptionModal(true);
      return;
    }
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/exams/${test.id}` } } });
      return;
    }
    if (startingTestId) return;

    try {
      setStartingTestId(test.id);
      const attemptInfo = await api.startTestAttempt(test.id);
      navigate(`/exams/${test.id}/runner?attemptId=${attemptInfo.attemptId}`);
    } catch (err) {
      console.error('Failed to start test attempt:', err);
      alert('Failed to initialize test attempt. Please try again.');
    } finally {
      setStartingTestId(null);
    }
  };

  if (!currentExam && !loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center pk-student-page">
        <EmptyState
          title="Examination not found"
          description="The requested examination could not be found or is no longer active."
          actionLabel="Browse All Exams"
          onAction={() => navigate('/exams')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/exams" className="hover:text-slate-900 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            All Examinations
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{currentExam?.title}</span>
        </div>

        {/* Exam Header Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                  {currentExam?.category || 'Competitive Exam'}
                </span>
                {currentExam?.totalVacancies && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {currentExam.totalVacancies.toLocaleString()} Vacancies
                  </span>
                )}
                {isPro && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    Pro Pass Unlocked
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentExam?.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {currentExam?.description ||
                  'Structured preparation system: simulate the complete exam pattern with Full Mocks, analyze previous patterns with PYQs, and master individual chapters with reusable Topic Tests.'}
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0">
              <div className="text-center">
                <div className="text-lg font-black text-brand-700">{fullMockTests.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">Full Mocks</div>
              </div>
              <div className="text-center border-x border-slate-200 px-2">
                <div className="text-lg font-black text-amber-700">{pyqTests.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">PYQ Papers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-blue-700">{topicTests.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">Topic Tests</div>
              </div>
            </div>
          </div>
        </div>

        {/* Curated Test Series Switcher */}
        {testSeriesList.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    Curated Test Series
                    <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                      {testSeriesList.length} Available
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Filter by curated package: each series neatly combines Full Mocks, Topic Tests &
                    PYQ papers.
                  </p>
                </div>
              </div>

              {selectedSeriesId !== 'all' && (
                <button
                  onClick={() => handleSeriesSelect('all')}
                  className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline self-start sm:self-auto inline-flex items-center gap-1"
                >
                  ✕ Show All Exam Tests
                </button>
              )}
            </div>

            {/* Series Filter Selector Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5">
              <button
                onClick={() => handleSeriesSelect('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedSeriesId === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>All Exam Tests</span>
                <span
                  className={`text-[10px] py-0.2 px-1.5 rounded-full font-extrabold ${
                    selectedSeriesId === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {fullMockTests.length + pyqTests.length + topicTests.length}
                </span>
              </button>

              {testSeriesList.map((series) => {
                const isSelected = selectedSeriesId === series.id;
                const totalInSeries =
                  (series.fullMockCount || 0) +
                  (series.topicTestCount || 0) +
                  (series.pyqTestCount || 0);

                return (
                  <button
                    key={series.id}
                    onClick={() => handleSeriesSelect(series.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-sm ring-1 ring-brand-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{series.title}</span>
                    {series.isPremium ? (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        PRO
                      </span>
                    ) : (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        FREE
                      </span>
                    )}
                    <span
                      className={`text-[10px] py-0.2 px-1.5 rounded-full font-extrabold ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {totalInSeries} Tests
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Series Organized Breakdown Showcase Banner */}
        {activeSeries && (
          <div className="bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-brand-800/50 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/25 text-brand-300 border border-brand-400/30">
                      Curated Test Series
                    </span>
                    {activeSeries.isPremium ? (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 inline-flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        Pro Pass Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                        Free Access
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {activeSeries.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeSeries.description ||
                      'Complete curated series structured into Full Mock simulations, chapter-wise Topic Tests, and official Previous Year Question papers.'}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSeriesSelect('all')}
                  className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-xs shrink-0 self-start"
                >
                  View All Exam Tests
                </Button>
              </div>

              {/* 3 Organized Sections inside the Test Series */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Section 1: Full Mock Tests */}
                <button
                  onClick={() => handleTabChange('full-mock')}
                  className={`p-4 rounded-2xl border text-left transition-all group ${
                    activeTab === 'full-mock'
                      ? 'bg-emerald-500/15 border-emerald-500/60 shadow-inner ring-1 ring-emerald-400/40'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🎯</span>
                    <span className="text-xl font-black text-emerald-400">
                      {activeSeries.fullMockCount || 0}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                    <span>Full Mock Tests</span>
                    {activeTab === 'full-mock' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200">
                        Viewing
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    Full syllabus exam simulations
                  </div>
                </button>

                {/* Section 2: Topic Tests */}
                <button
                  onClick={() => handleTabChange('topic-tests')}
                  className={`p-4 rounded-2xl border text-left transition-all group ${
                    activeTab === 'topic-tests'
                      ? 'bg-sky-500/15 border-sky-500/60 shadow-inner ring-1 ring-sky-400/40'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-sky-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">📚</span>
                    <span className="text-xl font-black text-sky-400">
                      {activeSeries.topicTestCount || 0}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-white group-hover:text-sky-300 transition-colors flex items-center justify-between">
                    <span>Topic Tests</span>
                    {activeTab === 'topic-tests' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-200">
                        Viewing
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    Subject & chapter concept drills
                  </div>
                </button>

                {/* Section 3: PYQ Tests */}
                <button
                  onClick={() => handleTabChange('pyq')}
                  className={`p-4 rounded-2xl border text-left transition-all group ${
                    activeTab === 'pyq'
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-inner ring-1 ring-amber-400/40'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">📜</span>
                    <span className="text-xl font-black text-amber-400">
                      {activeSeries.pyqTestCount || 0}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                    <span>PYQ Papers</span>
                    {activeTab === 'pyq' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200">
                        Viewing
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    Official previous year papers
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3 Core Architecture Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleTabChange('full-mock')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'full-mock'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>Full Mock Test</span>
              <span
                className={`text-[11px] py-0.5 px-2 rounded-full font-extrabold ml-1 hidden sm:inline-block ${
                  activeTab === 'full-mock'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {displayedFullMockTests.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('pyq')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'pyq'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>PYQ (Previous Years)</span>
              <span
                className={`text-[11px] py-0.5 px-2 rounded-full font-extrabold ml-1 hidden sm:inline-block ${
                  activeTab === 'pyq' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {displayedPyqTests.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('topic-tests')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'topic-tests'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Topic Tests</span>
              <span
                className={`text-[11px] py-0.5 px-2 rounded-full font-extrabold ml-1 hidden sm:inline-block ${
                  activeTab === 'topic-tests'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {displayedTopicTests.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: FULL MOCK TESTS */}
        {activeTab === 'full-mock' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-600" />
                  Full Exam Simulations
                </h2>
                <p className="text-xs text-slate-500">
                  Full length tests matching the official syllabus, time duration, and negative
                  marking scheme.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {displayedFullMockTests.length} Tests Available
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-28 bg-slate-200 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : displayedFullMockTests.length === 0 ? (
              <EmptyState
                title={
                  activeSeries
                    ? `No Full Mocks in ${activeSeries.title}`
                    : 'No Full Mock tests available yet'
                }
                description={
                  activeSeries
                    ? `This series currently includes ${activeSeries.topicTestCount || 0} Topic Tests and ${activeSeries.pyqTestCount || 0} PYQ Papers.`
                    : 'Our academic content team is formulating standard full-length simulation tests for this examination.'
                }
                actionLabel={activeSeries ? 'View All Exam Tests' : undefined}
                onAction={activeSeries ? () => handleSeriesSelect('all') : undefined}
              />
            ) : (
              <div className="space-y-3">
                {displayedFullMockTests.map((test) => {
                  const isLocked = test.isPremium && !isPro && user?.role !== 'admin';
                  const seriesTitle =
                    test.testSeriesTitle ||
                    (test.testSeriesId ? seriesMap.get(test.testSeriesId)?.title : undefined);

                  return (
                    <Card
                      key={test.id}
                      hoverable
                      onClick={() => handleTestClick(test)}
                      className={`p-5 transition-all cursor-pointer border ${
                        isLocked
                          ? 'border-amber-200/80 hover:border-amber-300'
                          : 'border-slate-200 hover:border-brand-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2 max-w-xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                              🎯 FULL MOCK
                            </span>
                            {seriesTitle && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                                <Layers className="w-2.5 h-2.5 text-violet-600" />
                                {seriesTitle}
                              </span>
                            )}
                            {test.isPremium ? (
                              <Badge variant="premium" className="text-[10px] py-0 px-2">
                                <Crown className="w-2.5 h-2.5 inline mr-1" />
                                Pro Pass
                              </Badge>
                            ) : (
                              <Badge variant="free" className="text-[10px] py-0 px-2">
                                Free Starter
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                            {test.title}
                          </h3>

                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                            <span className="flex items-center gap-1">
                              <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                              {test.totalQuestions} Questions
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {test.durationMinutes} Mins
                            </span>
                            <span>•</span>
                            <span>{test.totalMarks} Marks</span>
                            {test.negativeMarking > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-amber-600 font-semibold">
                                  -{test.negativeMarking} Neg.
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isLocked ? (
                            <Button
                              variant="pro"
                              size="sm"
                              className="w-full sm:w-auto font-bold gap-1 text-xs"
                              onClick={(e) => handleStartRunner(test, e)}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Unlock with Pro
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full sm:w-auto font-bold gap-1 text-xs"
                              isLoading={startingTestId === test.id}
                              disabled={Boolean(startingTestId)}
                              onClick={(e) => handleStartRunner(test, e)}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Start Mock Test
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: PYQ (PREVIOUS YEAR QUESTIONS) */}
        {activeTab === 'pyq' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-600" />
                  Official Previous Year Question Papers (PYQ)
                </h2>
                <p className="text-xs text-slate-500">
                  Solve real past examination papers with instant timer, negative marking, and
                  detailed answer analysis.
                </p>
              </div>

              {/* Year Filter Chips */}
              {availableYears.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setSelectedYear('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      selectedYear === 'all'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Years
                  </button>
                  {availableYears.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr.toString())}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        selectedYear === yr.toString()
                          ? 'bg-amber-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-28 bg-slate-200 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : displayedPyqTests.length === 0 ? (
              <EmptyState
                title={
                  activeSeries
                    ? `No PYQ papers in ${activeSeries.title}`
                    : 'No Previous Year Question papers available'
                }
                description={
                  activeSeries
                    ? `This series currently includes ${activeSeries.fullMockCount || 0} Full Mocks and ${activeSeries.topicTestCount || 0} Topic Tests.`
                    : 'Past examination papers are being digitized with detailed explanations for this exam.'
                }
                actionLabel={activeSeries ? 'View All Exam Tests' : undefined}
                onAction={activeSeries ? () => handleSeriesSelect('all') : undefined}
              />
            ) : (
              <div className="space-y-3">
                {displayedPyqTests.map((test) => {
                  const isLocked = test.isPremium && !isPro && user?.role !== 'admin';
                  const seriesTitle =
                    test.testSeriesTitle ||
                    (test.testSeriesId ? seriesMap.get(test.testSeriesId)?.title : undefined);

                  return (
                    <Card
                      key={test.id}
                      hoverable
                      onClick={() => handleTestClick(test)}
                      className={`p-5 transition-all cursor-pointer border ${
                        isLocked
                          ? 'border-amber-200/80 hover:border-amber-300'
                          : 'border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2 max-w-xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              📜 PYQ {test.year ? `• ${test.year}` : ''}
                            </span>
                            {seriesTitle && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <Layers className="w-2.5 h-2.5 text-amber-600" />
                                {seriesTitle}
                              </span>
                            )}
                            {test.isPremium ? (
                              <Badge variant="premium" className="text-[10px] py-0 px-2">
                                <Crown className="w-2.5 h-2.5 inline mr-1" />
                                Pro Pass
                              </Badge>
                            ) : (
                              <Badge variant="free" className="text-[10px] py-0 px-2">
                                Free Official Paper
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                            {test.title}
                          </h3>

                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                            {test.year && (
                              <span className="flex items-center gap-1 text-slate-700 font-bold">
                                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                Year {test.year}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
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

                        <div className="flex items-center gap-2 shrink-0">
                          {isLocked ? (
                            <Button
                              variant="pro"
                              size="sm"
                              className="w-full sm:w-auto font-bold gap-1 text-xs"
                              onClick={(e) => handleStartRunner(test, e)}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Unlock Paper
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full sm:w-auto font-bold gap-1 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                              isLoading={startingTestId === test.id}
                              disabled={Boolean(startingTestId)}
                              onClick={(e) => handleStartRunner(test, e)}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Solve Paper
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: REUSABLE TOPIC TESTS */}
        {activeTab === 'topic-tests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Canonical Topic Tests
                </h2>
                <p className="text-xs text-slate-500">
                  Targeted chapter-wise drills centralized across multiple exams to build concept
                  mastery.
                </p>
              </div>

              {/* Subject Filter Pills */}
              {subjects.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setSelectedSubjectId('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      selectedSubjectId === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Subjects
                  </button>
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSubjectId(s.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        selectedSubjectId === s.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-28 bg-slate-200 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : displayedTopicTests.length === 0 &&
              (selectedSeriesId !== 'all' || visibleSubjectGroups.length === 0) ? (
              <EmptyState
                title={
                  activeSeries
                    ? `No Topic Tests in ${activeSeries.title}`
                    : 'No topic tests available for this selection'
                }
                description={
                  activeSeries
                    ? `This series currently includes ${activeSeries.fullMockCount || 0} Full Mocks and ${activeSeries.pyqTestCount || 0} PYQ Papers.`
                    : 'No topic tests currently published for this selection.'
                }
                actionLabel={activeSeries ? 'View All Exam Tests' : undefined}
                onAction={activeSeries ? () => handleSeriesSelect('all') : undefined}
              />
            ) : (
              <div className="space-y-6">
                {/* Configured Topic Tests */}
                {displayedTopicTests.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Standardized Topic Mock Tests ({displayedTopicTests.length})
                    </h3>
                    {displayedTopicTests.map((test) => {
                      const isLocked = test.isPremium && !isPro && user?.role !== 'admin';
                      const seriesTitle =
                        test.testSeriesTitle ||
                        (test.testSeriesId ? seriesMap.get(test.testSeriesId)?.title : undefined);

                      return (
                        <Card
                          key={test.id}
                          hoverable
                          onClick={() => handleTestClick(test)}
                          className={`p-5 transition-all cursor-pointer border ${
                            isLocked
                              ? 'border-amber-200/80 hover:border-amber-300'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-2 max-w-xl">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  📚 TOPIC TEST
                                </span>
                                {seriesTitle && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    <Layers className="w-2.5 h-2.5 text-blue-600" />
                                    {seriesTitle}
                                  </span>
                                )}
                                {test.subjectName && (
                                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                    {test.subjectName}
                                  </span>
                                )}
                                {test.chapterName && (
                                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                    {test.chapterName}
                                  </span>
                                )}
                                {test.isPremium ? (
                                  <Badge variant="premium" className="text-[10px] py-0 px-2">
                                    <Crown className="w-2.5 h-2.5 inline mr-1" />
                                    Pro Pass
                                  </Badge>
                                ) : (
                                  <Badge variant="free" className="text-[10px] py-0 px-2">
                                    Free Topic Test
                                  </Badge>
                                )}
                              </div>

                              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {test.title}
                              </h3>

                              <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                                <span className="flex items-center gap-1">
                                  <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
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

                            <div className="flex items-center gap-2 shrink-0">
                              {isLocked ? (
                                <Button
                                  variant="pro"
                                  size="sm"
                                  className="w-full sm:w-auto font-bold gap-1 text-xs"
                                  onClick={(e) => handleStartRunner(test, e)}
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  Unlock Topic
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="w-full sm:w-auto font-bold gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                  isLoading={startingTestId === test.id}
                                  disabled={Boolean(startingTestId)}
                                  onClick={(e) => handleStartRunner(test, e)}
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  Practice Topic
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Mapped Curriculum Topics Grid */}
                {visibleSubjectGroups.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        Syllabus & Practice Topics (
                        {visibleSubjectGroups.reduce((acc, g) => acc + g.topics.length, 0)} Topics)
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Concept-level questions from question bank
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {visibleSubjectGroups.flatMap((group) =>
                        group.topics.map((topic) => {
                          const topicTest = topicTests.find(
                            (t) => t.chapterId === topic.id || t.topicId === topic.id
                          );

                          return (
                            <div
                              key={topic.id}
                              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all flex flex-col justify-between gap-3 shadow-xs"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                    {group.subject.name}
                                  </span>
                                  {topicTest && (
                                    <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                      {topicTest.totalQuestions} Qs
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                  {topic.name}
                                </h4>
                                {topic.description && (
                                  <p className="text-xs text-slate-500 line-clamp-1">
                                    {topic.description}
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {topicTest ? `${topicTest.durationMinutes}m test` : 'Topic Bank'}
                                </span>
                                {topicTest ? (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    className="text-xs py-1 px-3 bg-blue-600 hover:bg-blue-700"
                                    isLoading={startingTestId === topicTest.id}
                                    disabled={Boolean(startingTestId)}
                                    onClick={(e) => handleStartRunner(topicTest, e)}
                                  >
                                    <Play className="w-3 h-3 fill-current" /> Start Drill
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs py-1 px-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                                    onClick={() => navigate(`/practice?chapterId=${topic.id}`)}
                                  >
                                    Practice Drill
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Subscription Lock Modal */}
        {showSubscriptionModal && selectedLockedTest && (
          <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-amber-200">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Crown className="w-6 h-6 fill-amber-500" />
                </div>
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Pro Pass Exclusive
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {selectedLockedTest.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This test is part of the premium PracticeKoro test series.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-amber-950">PracticeKoro Pro Pass</span>
                  <span className="text-base font-black text-amber-700">₹299 / 365 Days</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pt-1 border-t border-amber-200/60">
                  One Pro Pass unlocks all Full Mocks, PYQ papers, and Topic Tests across all exams.
                </p>
                <ul className="text-[11px] text-slate-700 space-y-1 pt-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Access all premium mock tests & test series
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Mistakes Notebook & detailed step-by-step solutions
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Unlimited re-attempts across all exams
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Button
                  variant="pro"
                  className="w-full font-bold"
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    navigate('/subscription');
                  }}
                >
                  Get Pro Pass — ₹299
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-500"
                  onClick={() => setShowSubscriptionModal(false)}
                >
                  Continue with Free Tests
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
