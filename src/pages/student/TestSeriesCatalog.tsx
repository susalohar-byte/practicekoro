import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StudentLoading, StudentLoadError } from '@/components/student/StudentLoadState';
import { PageHeader, FilterChip, studentCard } from '@/components/student/StudentUI';
import { getErrorMessage } from '@/lib/errors';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  ArrowRight,
  X,
  ChevronDown,
  Layers,
  FileText,
  FileCheck,
  RotateCcw,
  Lock,
  Crown,
} from 'lucide-react';
import type { TestSeries } from '@/types';

/**
 * Exam emblem for a series card. Prefer the admin-uploaded icon; otherwise use
 * the artwork that belongs to that exam only. Unknown exams get a monogram rather
 * than another exam's emblem.
 */
function resolveEmblem(series: TestSeries): string | null {
  if (series.iconUrl) return series.iconUrl;
  const t = `${series.title} ${series.examTitle || ''}`.toLowerCase();
  if (/\bwbp\b|west bengal police/.test(t)) return '/images/exams/emblem_series_wbp.png';
  if (/\bkp\b|kolkata police/.test(t)) return '/images/exams/emblem_series_kp.png';
  if (/railway|ntpc|\brrb\b/.test(t)) return '/images/exams/emblem_railway.png';
  if (/\bssc\b/.test(t)) return '/images/exams/emblem_series_ssc.png';
  if (/wbssc/.test(t)) return '/images/exams/emblem_wbssc.png';
  if (/wbpsc|\bpsc\b/.test(t)) return '/images/exams/emblem_wbpsc.png';
  if (/\btet\b/.test(t)) return '/images/exams/emblem_tet.png';
  return null;
}

/** Card previews show plain text; strip lightweight markdown such as **bold**. */
const plainText = (value: string) =>
  value
    .replace(/[*_`#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const SeriesEmblem: React.FC<{ series: TestSeries }> = ({ series }) => {
  const [failed, setFailed] = useState(false);
  const src = resolveEmblem(series);
  if (!src || failed) {
    const initials = series.title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
    return (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E2A8A] to-[#3142D6] text-white flex items-center justify-center text-sm font-black shrink-0">
        {initials || 'PK'}
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0">
      <img
        src={src}
        alt=""
        className="w-full h-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export const TestSeriesCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPro, isAdmin } = useAuth();

  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [examsList, setExamsList] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const loadVersion = useRef(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<
    'Most Popular' | 'Newest' | 'Most Tests' | 'A–Z'
  >('Most Popular');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Read initial exam filter from URL query
  const examParam = searchParams.get('exam') || '';
  const [selectedExamSlug, setSelectedExamSlug] = useState<string>(examParam);

  useEffect(() => {
    setSelectedExamSlug(examParam);
  }, [examParam]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setLoadError('');
    try {
      const [seriesData, examsData] = await Promise.all([
        api.getStudentTestSeries(),
        api.getExams(),
      ]);
      if (version !== loadVersion.current) return;
      setSeriesList(seriesData);
      setExamsList(examsData.map((e) => ({ id: e.id, title: e.title, slug: e.slug || e.id })));
    } catch (err) {
      if (version === loadVersion.current)
        setLoadError(getErrorMessage(err, 'Test series could not be loaded.'));
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadData();
    const unsubscribe = api.subscribeToStudentCatalogUpdates(loadData);
    const counter = loadVersion;
    return () => {
      counter.current++;
      unsubscribe();
    };
  }, [loadData]);

  // Filter series based on selected exam and search query
  const filteredList = useMemo(() => {
    return seriesList.filter((series) => {
      // 1. Exam filter
      if (selectedExamSlug) {
        const slug = selectedExamSlug.toLowerCase().replace(/_/g, '-').trim();
        const sExamId = (series.examId || '').toLowerCase();

        const selectedExam = examsList.find(
          (exam) => exam.id === selectedExamSlug || exam.slug === selectedExamSlug
        );
        const matchesExam = selectedExam ? series.examId === selectedExam.id : sExamId === slug;
        if (!matchesExam) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const title = (series.title || '').toLowerCase();
        const desc = (series.description || '').toLowerCase();
        const exam = (series.examTitle || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || exam.includes(q);
      }

      return true;
    });
  }, [seriesList, selectedExamSlug, searchQuery, examsList]);

  // Sort series
  const sortedList = useMemo(() => {
    const list = [...filteredList];
    if (selectedSort === 'Most Popular') {
      list.sort((a, b) => {
        const aPop = a.isPopular ? 1 : 0;
        const bPop = b.isPopular ? 1 : 0;
        if (aPop !== bPop) return bPop - aPop;
        const aCount = (a.fullMockCount ?? 0) + (a.topicTestCount ?? 0) + (a.pyqTestCount ?? 0);
        const bCount = (b.fullMockCount ?? 0) + (b.topicTestCount ?? 0) + (b.pyqTestCount ?? 0);
        return bCount - aCount;
      });
    } else if (selectedSort === 'Newest') {
      list.sort(
        (a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0)
      );
    } else if (selectedSort === 'Most Tests') {
      list.sort((a, b) => {
        const aCount = (a.fullMockCount ?? 0) + (a.topicTestCount ?? 0) + (a.pyqTestCount ?? 0);
        const bCount = (b.fullMockCount ?? 0) + (b.topicTestCount ?? 0) + (b.pyqTestCount ?? 0);
        return bCount - aCount;
      });
    } else if (selectedSort === 'A–Z') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [filteredList, selectedSort]);

  const handleCardClick = (series: TestSeries) => {
    const isPaid = series.isPremium;
    if (isPaid && !isPro && !isAdmin) {
      // User does not have active subscription for paid series -> show paywall
      navigate('/subscription');
    } else {
      // Allowed access -> open Test Series detail directly
      navigate(`/test-series/${series.id}`);
    }
  };

  const handleSelectExam = (slug: string, title?: string) => {
    setSelectedExamSlug(slug);
    if (slug) {
      setSearchParams({ exam: slug, ...(title ? { title } : {}) });
    } else {
      setSearchParams({});
    }
  };

  const selectedExamTitle = useMemo(() => {
    if (!selectedExamSlug) return 'All Exams';
    const found = examsList.find((e) => e.slug === selectedExamSlug || e.id === selectedExamSlug);
    return found ? found.title : selectedExamSlug.replace(/-/g, ' ');
  }, [selectedExamSlug, examsList]);

  const totalTests = useMemo(
    () =>
      seriesList.reduce(
        (sum, s) => sum + (s.fullMockCount ?? 0) + (s.topicTestCount ?? 0) + (s.pyqTestCount ?? 0),
        0
      ),
    [seriesList]
  );
  const freeCount = useMemo(() => seriesList.filter((s) => !s.isPremium).length, [seriesList]);

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER ── */}
      <PageHeader
        eyebrow="Mock tests & PYQs"
        title="Test Series"
        subtitle="Exam-pattern mock tests, topic tests and previous year papers."
        icon={Layers}
        onBack={() => navigate(-1)}
      />

      {/* ── 2. SUMMARY STRIP ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121A4D] via-[#1E2A8A] to-[#3142D6] text-white p-5 sm:p-7">
        <div
          className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-24 -bottom-20 w-48 h-48 rounded-full bg-[#4F7BFF]/30 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="max-w-xl">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Small tests, big results
            </h2>
            <p className="mt-1.5 text-sm text-white/75 font-medium">
              Practice on the real exam pattern, review detailed solutions and track your rank.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:w-[420px]">
            {[
              { label: 'Series', value: loading ? '–' : seriesList.length },
              { label: 'Tests', value: loading ? '–' : totalTests },
              { label: 'Free series', value: loading ? '–' : freeCount },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white/10 border border-white/15 px-3 py-3 text-center"
              >
                <p className="text-xl sm:text-2xl font-black leading-none">{s.value}</p>
                <p className="mt-1 text-[11px] font-semibold text-white/65">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. TOOLBAR: search, exam chips, sort ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search test series..."
              aria-label="Search test series"
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#3142D6]/50 focus:ring-4 focus:ring-[#3142D6]/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setIsSortDropdownOpen((prev) => !prev)}
              className="h-11 w-full sm:w-auto px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-[#3142D6]/40 flex items-center justify-between gap-2 cursor-pointer transition-colors"
            >
              <span className="text-slate-400 font-semibold">Sort:</span>
              <span>{selectedSort}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isSortDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 overflow-hidden py-1">
                {(['Most Popular', 'Newest', 'Most Tests', 'A–Z'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedSort(opt);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-sm font-semibold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      selectedSort === opt ? 'text-[#3142D6]' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedSort === opt && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {examsList.length > 0 && (
          <div
            className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1"
            role="group"
            aria-label="Filter by exam"
          >
            <FilterChip active={!selectedExamSlug} onClick={() => handleSelectExam('')}>
              All Exams
            </FilterChip>
            {examsList.map((exam) => (
              <FilterChip
                key={exam.id}
                active={selectedExamSlug === exam.slug || selectedExamSlug === exam.id}
                onClick={() => handleSelectExam(exam.slug, exam.title)}
              >
                {exam.title}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. RESULTS ── */}
      {!loading && !loadError && (
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 -mb-2">
          Showing{' '}
          <span className="text-[#121A4D] dark:text-white font-black">{sortedList.length}</span>{' '}
          {sortedList.length === 1 ? 'series' : 'series'}
          {selectedExamSlug ? ` for ${selectedExamTitle}` : ''}
        </p>
      )}

      {loadError ? (
        <StudentLoadError message={loadError} onRetry={() => void loadData()} />
      ) : loading ? (
        <StudentLoading label="Loading published test series" />
      ) : sortedList.length === 0 ? (
        <div className={`${studentCard} py-14 px-6 text-center space-y-3`}>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-[#3142D6]">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            No test series found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
            Try another exam or search term.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedExamSlug('');
              setSearchParams({});
            }}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#1E2A8A] hover:bg-[#3142D6] text-white text-sm font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedList.map((series) => {
            const isPaid = series.isPremium;
            const locked = isPaid && !isPro && !isAdmin;
            const stats = [
              { label: 'Full mocks', value: series.fullMockCount ?? 0, icon: FileText },
              { label: 'Topic tests', value: series.topicTestCount ?? 0, icon: Layers },
              { label: 'PYQs', value: series.pyqTestCount ?? 0, icon: FileCheck },
            ];

            return (
              <button
                type="button"
                key={series.id}
                onClick={() => handleCardClick(series)}
                className={`${studentCard} group text-left p-5 flex flex-col gap-4 hover:-translate-y-0.5 hover:border-[#3142D6]/30 hover:shadow-[0_16px_32px_-16px_rgba(30,42,138,0.35)] transition-all duration-200 cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <SeriesEmblem series={series} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {series.examTitle && (
                        <span className="text-[11px] font-bold text-[#3142D6] dark:text-[#8FB3FF] truncate">
                          {series.examTitle}
                        </span>
                      )}
                      {series.isPopular && (
                        <span className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300 text-[10px] font-black">
                          Popular
                        </span>
                      )}
                      {series.isFeatured && (
                        <span className="px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300 text-[10px] font-black">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="mt-0.5 text-[15px] font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#1E2A8A] dark:group-hover:text-[#8FB3FF] transition-colors">
                      {series.title}
                    </h3>
                  </div>
                </div>

                {(series.description || series.subtitle) && (
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 -mt-1">
                    {plainText(series.description || series.subtitle || '')}
                  </p>
                )}

                <div className="grid grid-cols-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 divide-x divide-slate-200/70 dark:divide-slate-700">
                  {stats.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[#121A4D] dark:text-white">
                        <Icon className="w-3.5 h-3.5 text-[#3142D6] dark:text-[#8FB3FF]" />
                        <span className="text-[15px] font-black">{value}</span>
                      </div>
                      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between">
                  {!isPaid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <Crown className="w-3 h-3" />
                      Free
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      <Lock className="w-3 h-3" />
                      {locked ? 'Pro' : 'Pro · Unlocked'}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-[#1E2A8A] dark:text-[#8FB3FF]">
                    {locked ? 'Unlock' : 'Open series'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
