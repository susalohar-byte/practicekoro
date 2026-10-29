import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Question, Subject, Chapter } from '@/types';
import { api } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';
import {
  computeQuestionBankStats,
  matchesQuestionBankQuery,
  type QuestionBankQuery,
  type QuestionBankStats,
} from '@/services/domains/admin.questionBank';

// Standard syllabus topics offered in the topic filter when a subject has none yet.
const FALLBACK_SUBJECT_TOPICS: Record<string, string[]> = {
  history: ['Modern India', 'Ancient India', 'Medieval India', 'Indian National Movement'],
  'general science': [
    'Chemical Reactions',
    'Human Body',
    'Heat & Temperature',
    'Light & Optics',
    'Periodic Table',
    'Cell Biology',
  ],
  'indian polity': [
    'Constitution',
    'Preamble',
    'Fundamental Rights',
    'President & Parliament',
    'Judiciary',
  ],
  mathematics: [
    'BODMAS',
    'Percentage',
    'Profit & Loss',
    'Time & Work',
    'Ratio & Proportion',
    'Algebra',
    'Geometry',
  ],
  geography: [
    'Rivers of India',
    'Physical Geography',
    'Indian Climate',
    'West Bengal Geography',
    'Soil & Vegetation',
  ],
  economy: ['Indian Economy', 'Five Year Plans', 'Banking & RBI', 'Inflation & National Income'],
  'general knowledge': [
    'National Symbols',
    'Important Days',
    'Awards & Honours',
    'Books & Authors',
  ],
  'static gk': [
    'National Symbols',
    'Important Days',
    'Awards & Honours',
    'Books & Authors',
    'West Bengal Culture',
  ],
  reasoning: [
    'Series Completion',
    'Blood Relations',
    'Coding-Decoding',
    'Analogy',
    'Direction Sense',
  ],
  english: [
    'Idioms & Phrases',
    'Synonyms & Antonyms',
    'One Word Substitution',
    'Grammar & Spotting Errors',
  ],
  bengali: ['বাংলা ব্যাকরণ', 'বাগধারা', 'এক কথায় প্রকাশ', 'সমার্থক শব্দ', 'সন্ধি বিচ্ছেদ'],
};

interface QuestionBankFiltersInput {
  /** Rows on screen: the current server page (Supabase) or the whole demo store. */
  questions: Question[];
  /** Replaces the rows with a freshly fetched server page (no refresh side effects). */
  setPageQuestions: (rows: Question[]) => void;
  /** Changes whenever the page and counts must be fetched again. */
  dataVersion: number;
  subjects: Subject[];
  topics: Chapter[];
  isLoading: boolean;
  liveQuestionIndex: Record<string, string>;
  showToast: (msg: string) => void;
}

const EMPTY_STATS: QuestionBankStats = {
  total: 0,
  examQuestions: 0,
  subjectQuestions: 0,
  liveQuestions: 0,
  published: 0,
  draft: 0,
  underReview: 0,
};

/** Debounces a value (search typing should not fire one server query per keystroke). */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** Question Bank upload-mode tabs, filter bar, statistics and pagination. */
export function useQuestionBankFilters({
  questions,
  setPageQuestions,
  dataVersion,
  subjects,
  topics,
  isLoading,
  liveQuestionIndex,
  showToast,
}: QuestionBankFiltersInput) {
  // Top Upload Mode Filter: 'all' | 'exam' | 'subject' | 'live'
  const [activeUploadMode, setActiveUploadMode] = useState<'all' | 'exam' | 'subject' | 'live'>(
    'all'
  );

  // Live Test mode: the Live Test paper whose questions are listed
  const [selectedLiveTestFilter, setSelectedLiveTestFilter] = useState('all');

  // Filter Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModeFilter, setViewModeFilter] = useState<'all' | 'exam' | 'subject' | 'live'>('all');
  const [selectedExamFilter, setSelectedExamFilter] = useState('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Honour deep links such as ?source=topic&subjectId=…&topicId=… (from Topic Manage)
  // by applying them as the initial filters once the taxonomy lists are loaded.
  const [searchParams] = useSearchParams();
  const appliedUrlFilters = useRef(false);
  useEffect(() => {
    if (appliedUrlFilters.current || isLoading) return;
    appliedUrlFilters.current = true;
    const subjectId = searchParams.get('subjectId');
    const topicId = searchParams.get('topicId');
    const source = searchParams.get('source');
    const subjectName = subjectId ? subjects.find((s) => s.id === subjectId)?.name : undefined;
    const topicName = topicId ? topics.find((t) => t.id === topicId)?.name : undefined;
    if (subjectName) setSelectedSubjectFilter(subjectName);
    if (topicName) setSelectedTopicFilter(topicName);
    if (source === 'pyq' || source === 'topic') setSelectedTypeFilter(source);
    if (subjectName || topicName || source) setCurrentPage(1);
  }, [isLoading, searchParams, subjects, topics]);

  // Topic options for the filter bar:
  // When a subject is selected, ONLY topics of that selected subject are returned.
  const filterTopicOptions = useMemo(() => {
    if (selectedSubjectFilter === 'all') {
      const names = new Set<string>();
      topics.forEach((t) => {
        if (t.name?.trim()) names.add(t.name.trim());
      });
      questions.forEach((q) => {
        const top = (q.topicName || q.chapterName)?.trim();
        if (top) names.add(top);
      });
      return Array.from(names).sort((a, b) => a.localeCompare(b));
    }

    const subject = subjects.find(
      (s) =>
        s.name.toLowerCase() === selectedSubjectFilter.toLowerCase() ||
        s.id === selectedSubjectFilter
    );
    const subjectId = subject?.id;
    const subjectNameLower = selectedSubjectFilter.toLowerCase();
    const topicNames = new Set<string>();

    // 1. From database topics (Chapter) linked to this subject
    topics.forEach((t) => {
      if (subjectId && t.subjectId === subjectId) {
        if (t.name?.trim()) topicNames.add(t.name.trim());
      }
    });

    // 2. From questions belonging to this subject
    questions.forEach((q) => {
      const qSubject = (q.subjectName || '').toLowerCase();
      if (qSubject === subjectNameLower || (subjectId && q.subjectId === subjectId)) {
        const top = (q.topicName || q.chapterName)?.trim();
        if (top) topicNames.add(top);
      }
    });

    // 3. Fallback standard syllabus topics by subject

    if (topicNames.size === 0) {
      const fallbacks = FALLBACK_SUBJECT_TOPICS[subjectNameLower];
      if (fallbacks) {
        fallbacks.forEach((f) => topicNames.add(f));
      }
    }

    return Array.from(topicNames).sort((a, b) => a.localeCompare(b));
  }, [selectedSubjectFilter, subjects, topics, questions]);

  // If a topic was selected that does not belong to the newly selected subject, reset to 'all'
  useEffect(() => {
    if (selectedSubjectFilter !== 'all' && selectedTopicFilter !== 'all') {
      const match = filterTopicOptions.some(
        (t) => t.toLowerCase() === selectedTopicFilter.toLowerCase()
      );
      if (!match) {
        setSelectedTopicFilter('all');
      }
    }
  }, [selectedSubjectFilter, selectedTopicFilter, filterTopicOptions]);

  // The active filters as one list query: run on the server (Supabase) or in the browser (demo).
  const debouncedSearch = useDebouncedValue(searchQuery, isSupabaseConfigured ? 300 : 0);
  const listQuery = useMemo<QuestionBankQuery>(() => {
    const live = activeUploadMode === 'live';
    const lower = (v: string) => v.toLowerCase();
    const term = debouncedSearch.trim() ? lower(debouncedSearch.trim()) : '';
    const subjectName = selectedSubjectFilter !== 'all' ? selectedSubjectFilter : undefined;
    const topicName = selectedTopicFilter !== 'all' ? selectedTopicFilter : undefined;
    return {
      liveOnly: live,
      questionIds:
        live && selectedLiveTestFilter !== 'all'
          ? Object.keys(liveQuestionIndex).filter(
              (qid) => liveQuestionIndex[qid] === selectedLiveTestFilter
            )
          : undefined,
      examMode: activeUploadMode === 'exam' || viewModeFilter === 'exam',
      subjectMode: activeUploadMode === 'subject' || viewModeFilter === 'subject',
      search: term || undefined,
      searchSubjectIds: term
        ? subjects.filter((s) => lower(s.name || '').includes(term)).map((s) => s.id)
        : undefined,
      searchChapterIds: term
        ? topics.filter((t) => lower(t.name || '').includes(term)).map((t) => t.id)
        : undefined,
      sourceExam: selectedExamFilter !== 'all' ? selectedExamFilter : undefined,
      subjectName,
      subjectIds: subjectName
        ? subjects.filter((s) => lower(s.name || '').includes(lower(subjectName))).map((s) => s.id)
        : undefined,
      topicName,
      chapterIds: topicName
        ? topics.filter((t) => lower(t.name || '').includes(lower(topicName))).map((t) => t.id)
        : undefined,
      type: selectedTypeFilter !== 'all' ? selectedTypeFilter : undefined,
      status: selectedStatusFilter !== 'all' ? selectedStatusFilter : undefined,
      sourceYear: selectedYearFilter !== 'all' ? selectedYearFilter : undefined,
      source: selectedSourceFilter !== 'all' ? selectedSourceFilter : undefined,
    };
  }, [
    activeUploadMode,
    selectedLiveTestFilter,
    liveQuestionIndex,
    debouncedSearch,
    viewModeFilter,
    selectedExamFilter,
    selectedSubjectFilter,
    selectedTopicFilter,
    selectedTypeFilter,
    selectedStatusFilter,
    selectedYearFilter,
    selectedSourceFilter,
    subjects,
    topics,
  ]);

  // Demo store: filter the whole local list in the browser, as before.
  const localFiltered = useMemo(
    () =>
      isSupabaseConfigured ? [] : questions.filter((q) => matchesQuestionBankQuery(q, listQuery)),
    [questions, listQuery]
  );

  // Supabase: only the visible page is fetched, with the exact total of matching rows.
  const [serverTotal, setServerTotal] = useState(0);
  const [serverStats, setServerStats] = useState<QuestionBankStats>(EMPTY_STATS);
  const queryKey = JSON.stringify(listQuery);

  // A changed filter starts again on page 1.
  const previousQueryKey = useRef(queryKey);
  useEffect(() => {
    if (previousQueryKey.current !== queryKey) {
      previousQueryKey.current = queryKey;
      setCurrentPage(1);
    }
  }, [queryKey]);

  useEffect(() => {
    if (!isSupabaseConfigured || isLoading) return;
    let cancelled = false;
    api
      .getQuestionBankPage(listQuery, currentPage, pageSize)
      .then(({ questions: rows, total }) => {
        if (cancelled) return;
        setPageQuestions(rows);
        setServerTotal(total);
      })
      .catch((err: unknown) => {
        if (!cancelled) showToast(getErrorMessage(err, 'Questions could not be loaded.'));
      });
    return () => {
      cancelled = true;
    };
    // listQuery is represented by queryKey; showToast / setPageQuestions are stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, currentPage, pageSize, dataVersion, isLoading]);

  useEffect(() => {
    if (!isSupabaseConfigured || isLoading) return;
    let cancelled = false;
    api
      .getQuestionBankStats()
      .then((next) => {
        if (!cancelled) setServerStats(next);
      })
      .catch(() => {
        // Stat cards keep their previous numbers; the list reports its own errors.
      });
    return () => {
      cancelled = true;
    };
  }, [dataVersion, isLoading]);

  const filteredTotal = isSupabaseConfigured ? serverTotal : localFiltered.length;

  /** Ids of every question matching the filters (all pages), for "Select All N". */
  const getFilteredQuestionIds = useCallback(async (): Promise<string[]> => {
    if (!isSupabaseConfigured) return localFiltered.map((q) => q.id);
    return api.getQuestionBankIds(listQuery);
  }, [localFiltered, listQuery]);

  // Exam and Live Test modes do not use Subject / Topic: clear those filters when entering them
  useEffect(() => {
    if (
      activeUploadMode === 'exam' ||
      activeUploadMode === 'live' ||
      viewModeFilter === 'exam' ||
      viewModeFilter === 'live'
    ) {
      setSelectedSubjectFilter('all');
      setSelectedTopicFilter('all');
    }
  }, [activeUploadMode, viewModeFilter]);

  // Statistics grounded to database numbers (head counts with Supabase)
  const stats = useMemo(
    () => (isSupabaseConfigured ? serverStats : computeQuestionBankStats(questions)),
    [serverStats, questions]
  );

  // Paginated List
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const paginatedQuestions = useMemo(() => {
    if (isSupabaseConfigured) return questions;
    const start = (currentPage - 1) * pageSize;
    return localFiltered.slice(start, start + pageSize);
  }, [questions, localFiltered, currentPage, pageSize]);

  // Keep page within bounds when filters change or questions are modified
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return {
    activeUploadMode,
    setActiveUploadMode,
    selectedLiveTestFilter,
    setSelectedLiveTestFilter,
    searchQuery,
    setSearchQuery,
    viewModeFilter,
    setViewModeFilter,
    selectedExamFilter,
    setSelectedExamFilter,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    selectedTopicFilter,
    setSelectedTopicFilter,
    selectedTypeFilter,
    setSelectedTypeFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    selectedYearFilter,
    setSelectedYearFilter,
    selectedSourceFilter,
    setSelectedSourceFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    filterTopicOptions,
    filteredTotal,
    getFilteredQuestionIds,
    stats,
    totalPages,
    paginatedQuestions,
  };
}
