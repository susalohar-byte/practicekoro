import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Question, Subject, Chapter } from '@/types';
import { questionBankType, questionBankStatus } from './questionBankUtils';

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
  questions: Question[];
  subjects: Subject[];
  topics: Chapter[];
  isLoading: boolean;
  liveQuestionIndex: Record<string, string>;
}

/** Question Bank upload-mode tabs, filter bar, statistics and pagination. */
export function useQuestionBankFilters({
  questions,
  subjects,
  topics,
  isLoading,
  liveQuestionIndex,
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

  // Filtered Questions Dataset
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 0. Live Test questions appear only in the Live Test mode (and never in Exam/Subject)
      if (activeUploadMode === 'live') {
        if (!q.isLiveOnly) return false;
        if (selectedLiveTestFilter !== 'all' && liveQuestionIndex[q.id] !== selectedLiveTestFilter)
          return false;
      } else if (q.isLiveOnly) {
        return false;
      }

      // 1. Top Selector Mode Filter (By Exam vs By Subject)
      if (activeUploadMode === 'exam' && q.uploadMode !== 'exam' && !q.sourceExam) return false;
      if (activeUploadMode === 'subject' && q.uploadMode === 'exam' && q.sourceExam) return false;

      // 2. View Mode Filter
      if (viewModeFilter === 'exam' && q.uploadMode !== 'exam' && !q.sourceExam) return false;
      if (viewModeFilter === 'subject' && q.uploadMode === 'exam' && q.sourceExam) return false;

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesBen = q.questionBengaliText?.toLowerCase().includes(query);
        const matchesEng = q.questionText?.toLowerCase().includes(query);
        const matchesOptA = q.optionA?.toLowerCase().includes(query);
        const matchesOptB = q.optionB?.toLowerCase().includes(query);
        const matchesOptC = q.optionC?.toLowerCase().includes(query);
        const matchesOptD = q.optionD?.toLowerCase().includes(query);
        const matchesId = q.id?.toLowerCase().includes(query);
        const matchesTopic =
          q.topicName?.toLowerCase().includes(query) ||
          q.chapterName?.toLowerCase().includes(query);
        const matchesExam = q.sourceExam?.toLowerCase().includes(query);
        const matchesSubject = q.subjectName?.toLowerCase().includes(query);

        if (
          !matchesBen &&
          !matchesEng &&
          !matchesOptA &&
          !matchesOptB &&
          !matchesOptC &&
          !matchesOptD &&
          !matchesId &&
          !matchesTopic &&
          !matchesExam &&
          !matchesSubject
        ) {
          return false;
        }
      }

      // 4. Exam Filter
      if (selectedExamFilter !== 'all') {
        if (
          !q.sourceExam ||
          !q.sourceExam.toLowerCase().includes(selectedExamFilter.toLowerCase())
        ) {
          return false;
        }
      }

      // 5. Subject Filter
      if (selectedSubjectFilter !== 'all') {
        if (
          !q.subjectName ||
          !q.subjectName.toLowerCase().includes(selectedSubjectFilter.toLowerCase())
        ) {
          return false;
        }
      }

      // 6. Topic Filter
      if (selectedTopicFilter !== 'all') {
        const top = q.topicName || q.chapterName || '';
        if (!top.toLowerCase().includes(selectedTopicFilter.toLowerCase())) {
          return false;
        }
      }

      // 7. Type Filter
      if (selectedTypeFilter !== 'all') {
        const t = questionBankType(q).toLowerCase();
        if (t !== selectedTypeFilter.toLowerCase()) return false;
      }

      // 8. Status Filter
      if (selectedStatusFilter !== 'all') {
        const s = questionBankStatus(q);
        if (s !== selectedStatusFilter.toLowerCase()) return false;
      }

      // 9. Year Filter
      if (selectedYearFilter !== 'all') {
        if (String(q.sourceYear) !== selectedYearFilter) return false;
      }

      // 10. Source Filter
      if (selectedSourceFilter !== 'all') {
        const src = (q.sourceType === 'pyq' ? 'Official PYQ' : 'Original').toLowerCase();
        if (!src.includes(selectedSourceFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [
    questions,
    activeUploadMode,
    selectedLiveTestFilter,
    liveQuestionIndex,
    searchQuery,
    viewModeFilter,
    selectedExamFilter,
    selectedSubjectFilter,
    selectedTopicFilter,
    selectedTypeFilter,
    selectedStatusFilter,
    selectedYearFilter,
    selectedSourceFilter,
  ]);

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

  // Statistics calculation grounded to database numbers
  const stats = useMemo(() => {
    const total = questions.length;
    const bankQuestions = questions.filter((q) => !q.isLiveOnly);
    const examQuestions = bankQuestions.filter(
      (q) => q.uploadMode === 'exam' || Boolean(q.sourceExam)
    ).length;
    const subjectQuestions = bankQuestions.filter(
      (q) => q.uploadMode === 'subject' || (!q.sourceExam && Boolean(q.subjectId || q.subjectName))
    ).length;
    const liveQuestions = questions.length - bankQuestions.length;
    const published = questions.filter((q) => questionBankStatus(q) === 'published').length;
    const draft = questions.filter((q) => questionBankStatus(q) === 'draft').length;
    const underReview = questions.filter((q) => {
      const status = questionBankStatus(q);
      return status === 'under_review' || status === 'review';
    }).length;
    return {
      total,
      examQuestions,
      subjectQuestions,
      liveQuestions,
      published,
      draft,
      underReview,
    };
  }, [questions]);

  // Paginated List
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

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
    filteredQuestions,
    stats,
    totalPages,
    paginatedQuestions,
  };
}
