import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Question, Exam, Subject, Chapter, LiveTest } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_DEMO_QUESTIONS } from './demoQuestions';
import {
  UploadMode,
  QuestionBankStatus,
  questionBankType,
  questionBankStatus,
} from './questionBankUtils';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { useSearchParams } from 'react-router-dom';
import { runConfirmedBatch } from '@/services/domains/admin.mutations';
import { csvCell } from '@/utils/csvExport';
import { parseCsvRaw } from '@/utils/csvParser';
import { parseQuestionsTxt, downloadSampleTxt } from '@/utils/txtQuestionParser';

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

export function useAdminQuestionBank() {
  // Master Taxonomy & State
  const [questions, setQuestions] = useState<Question[]>(
    isSupabaseConfigured ? [] : INITIAL_DEMO_QUESTIONS
  );
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Top Upload Mode Filter: 'all' | 'exam' | 'subject' | 'live'
  const [activeUploadMode, setActiveUploadMode] = useState<'all' | 'exam' | 'subject' | 'live'>(
    'all'
  );

  // Live Test mode: questions uploaded into Live Test papers (kept apart from Exam/Subject)
  const [liveTests, setLiveTests] = useState<LiveTest[]>([]);
  const [liveQuestionIndex, setLiveQuestionIndex] = useState<Record<string, string>>({});
  const [selectedLiveTestFilter, setSelectedLiveTestFilter] = useState('all');
  const [isLiveUploadOpen, setIsLiveUploadOpen] = useState(false);
  // Title of the Live Test a live question belongs to (for the table and the drawer)
  const liveTestTitleFor = useCallback(
    (questionId: string) => {
      const liveId = liveQuestionIndex[questionId];
      return liveTests.find((lt) => lt.id === liveId)?.title || 'Live Test';
    },
    [liveQuestionIndex, liveTests]
  );

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

  // Selected Rows for Bulk Actions
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Active / Opened Question in Right Drawer (Defaults to null - neutral initial state)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'explanation' | 'history'>('details');

  // Drawer Edit Form States
  const [drawerBengaliText, setDrawerBengaliText] = useState('');
  const [drawerEnglishText, setDrawerEnglishText] = useState('');
  const [drawerOptions, setDrawerOptions] = useState<{ [key: string]: string }>({
    A: '',
    B: '',
    C: '',
    D: '',
  });
  const [drawerCorrectOption, setDrawerCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [drawerUploadMode, setDrawerUploadMode] = useState<UploadMode>('exam');
  const [drawerExam, setDrawerExam] = useState('');
  const [drawerSubject, setDrawerSubject] = useState('');
  const [drawerTopic, setDrawerTopic] = useState('');
  const [drawerType, setDrawerType] = useState<'PYQ' | 'Topic' | 'Full Mock'>('Topic');
  const [drawerYear, setDrawerYear] = useState<number | string>('');
  const [drawerSource, setDrawerSource] = useState('Official PYQ');
  const [drawerStatus, setDrawerStatus] = useState<QuestionBankStatus>('published');
  const [drawerTags, setDrawerTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isUpdatingDrawer, setIsUpdatingDrawer] = useState(false);

  // Drawer Explanation Edit State (English and Bengali are stored separately)
  const [editExplanation, setEditExplanation] = useState('');
  const [editExplanationBengali, setEditExplanationBengali] = useState('');

  // Floating Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Top-Right Action Menus & Modals
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalUploadMode, setModalUploadMode] = useState<UploadMode>('exam');

  // Add Modal Form State
  const [addExam, setAddExam] = useState('WBP Constable');
  const [addExamQuestionType, setAddExamQuestionType] = useState<'Full Mock' | 'Official PYQ'>(
    'Official PYQ'
  );
  const [addYear, setAddYear] = useState('2025');
  const [addPaper, setAddPaper] = useState('Set A');
  const [addSection, setAddSection] = useState('General Awareness');
  const [addSubject, setAddSubject] = useState('General Science');
  const [addTopic, setAddTopic] = useState('Heat & Temperature');
  const [addSubtopic, setAddSubtopic] = useState('');
  const [addQuestionBengali, setAddQuestionBengali] = useState('');
  const [addQuestionEnglish, setAddQuestionEnglish] = useState('');
  const [addOptA, setAddOptA] = useState('');
  const [addOptB, setAddOptB] = useState('');
  const [addOptC, setAddOptC] = useState('');
  const [addOptD, setAddOptD] = useState('');
  const [addCorrect, setAddCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [addMarks, setAddMarks] = useState(1);
  const [addNegativeMarks, setAddNegativeMarks] = useState(0.25);
  const [addExplanation, setAddExplanation] = useState('');
  const [addSource, setAddSource] = useState('Official PYQ');
  const [addTags, setAddTags] = useState<string[]>([]);
  const [addTagInput, setAddTagInput] = useState('');
  const [addStatus, setAddStatus] = useState<QuestionBankStatus>('published');
  const [duplicateWarning, setDuplicateWarning] = useState<{
    similarity: number;
    existingText: string;
  } | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<UploadMode>('exam');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImportQuestions, setParsedImportQuestions] = useState<Question[]>([]);
  const [importPreviewStats, setImportPreviewStats] = useState<{
    total: number;
    valid: number;
    errors: number;
    duplicates: number;
    errorList: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Template Download Menu State
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  // Row Action Dropdown state (row id)
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveActionMenuId(null);
      setIsAddMenuOpen(false);
      setIsTemplateMenuOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load Real Data from Backend API / Supabase
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allQuestions, allExams, allSubjects, allChapters, allLiveTests] = await Promise.all([
        // Live Test questions are loaded too, but only shown in the Live Test mode.
        api.getAllAdminQuestions({ includeLiveOnly: true }),
        api.getAllAdminExams().catch(() => []),
        api.getAllAdminSubjects().catch(() => []),
        api.getAllAdminChapters().catch(() => []),
        api.getLiveTests().catch(() => [] as LiveTest[]),
      ]);
      setLiveTests(allLiveTests);
      setLiveQuestionIndex(await api.getLiveQuestionIndex(allLiveTests).catch(() => ({})));

      if (allExams && allExams.length > 0) setExams(allExams);
      if (allSubjects && allSubjects.length > 0) setSubjects(allSubjects);
      if (allChapters && allChapters.length > 0) setTopics(allChapters);

      if (isSupabaseConfigured) {
        setQuestions(allQuestions || []);
      } else {
        if (allQuestions && allQuestions.length > 0) {
          // Merge without losing initial demo questions
          const existingIds = new Set(INITIAL_DEMO_QUESTIONS.map((dq) => dq.id));
          const merged = [
            ...INITIAL_DEMO_QUESTIONS,
            ...allQuestions.filter((q) => !existingIds.has(q.id)),
          ];
          setQuestions(merged);
        }
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Questions could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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

  // Synchronize drawer fields whenever activeQuestion changes
  useEffect(() => {
    if (activeQuestion) {
      setDrawerBengaliText(activeQuestion.questionBengaliText || '');
      setDrawerEnglishText(activeQuestion.questionText || '');
      setDrawerOptions({
        A: activeQuestion.optionA || '',
        B: activeQuestion.optionB || '',
        C: activeQuestion.optionC || '',
        D: activeQuestion.optionD || '',
      });
      setDrawerCorrectOption((activeQuestion.correctOption as 'A' | 'B' | 'C' | 'D') || 'A');
      setDrawerUploadMode(
        (activeQuestion.uploadMode as UploadMode) ||
          (activeQuestion.sourceExam ? 'exam' : 'subject')
      );
      setDrawerExam(activeQuestion.sourceExam || '');
      setDrawerSubject(
        activeQuestion.subjectName ||
          subjects.find((s) => s.id === activeQuestion.subjectId)?.name ||
          ''
      );
      setDrawerTopic(
        activeQuestion.topicName ||
          activeQuestion.chapterName ||
          topics.find((t) => t.id === (activeQuestion.chapterId || activeQuestion.topicId))?.name ||
          ''
      );
      setDrawerType(questionBankType(activeQuestion));
      setDrawerYear(activeQuestion.sourceYear || '');
      setDrawerTags(activeQuestion.tags || []);
      setDrawerSource(
        activeQuestion.sourceType === 'pyq'
          ? 'Official PYQ'
          : activeQuestion.sourceType === 'topic'
            ? 'Original'
            : 'Reference'
      );
      setDrawerStatus(
        activeQuestion.status === 'active'
          ? 'published'
          : (activeQuestion.status as QuestionBankStatus) || 'draft'
      );
      setEditExplanation(activeQuestion.explanation || '');
      setEditExplanationBengali(activeQuestion.explanationBengali || '');
    }
    // Re-sync only when a different question is opened/saved; taxonomy lists are
    // read as a fallback for name lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestion]);

  // Topic options for the drawer: topics of the selected subject when it is known.
  const drawerTopicNames = useMemo(() => {
    const subjectId = subjects.find((s) => s.name === drawerSubject)?.id;
    return topics.filter((t) => !subjectId || t.subjectId === subjectId).map((t) => t.name);
  }, [subjects, topics, drawerSubject]);

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

  // Checkbox Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(paginatedQuestions.map((q) => q.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (newStatus: QuestionBankStatus) => {
    const ids = Array.from(selectedRowIds);
    const batch = await runConfirmedBatch(ids, (id) =>
      api.updateQuestion(id, { status: newStatus, isActive: newStatus === 'published' })
    );
    const saved = new Map(batch.results.map((r) => [r.input, r.value]));
    setQuestions((prev) => prev.map((q) => saved.get(q.id) || q));
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    showToast(
      batch.results.length +
        ' saved; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : '')
    );
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (
      !selectedRowIds.size ||
      !window.confirm('Delete selected questions? Linked questions may be protected.')
    )
      return;
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.deleteQuestion(id)
    );
    const deleted = new Set(batch.results.map((r) => r.input));
    setQuestions((prev) => prev.filter((q) => !deleted.has(q.id)));
    setActiveQuestion((prev) => (prev && deleted.has(prev.id) ? null : prev));
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    showToast(
      deleted.size +
        ' deleted; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : '')
    );
  };

  // Export Selected to CSV
  const handleExportSelectedCSV = () => {
    if (selectedRowIds.size === 0) return;
    const toExport = questions.filter((q) => selectedRowIds.has(q.id));
    const headers = [
      'id',
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct',
      'exam',
      'subject',
      'topic',
      'status',
    ];
    const rows = toExport.map((q) => [
      q.id,
      q.questionBengaliText || q.questionText,
      q.optionA,
      q.optionB,
      q.optionC,
      q.optionD,
      q.correctOption,
      q.sourceExam || '',
      q.subjectName || '',
      q.topicName || '',
      questionBankStatus(q),
    ]);
    const csvContent =
      '\uFEFF' + headers.join(',') + '\n' + rows.map((r) => r.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `practicekoro_selected_questions_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${toExport.length} questions to CSV.`);
  };

  // Drawer Update Handler
  const handleUpdateDrawer = async () => {
    if (!activeQuestion || isUpdatingDrawer) return;
    try {
      setIsUpdatingDrawer(true);
      const englishText = drawerEnglishText.trim();
      const bengaliText = drawerBengaliText.trim();
      if (!englishText && !bengaliText) {
        showToast('Question text is required.');
        return;
      }
      const originalType = questionBankType(activeQuestion);
      const subjectId = drawerSubject
        ? subjects.find((s) => s.name === drawerSubject)?.id
        : undefined;
      const chapterId = drawerTopic
        ? topics.find((t) => t.name === drawerTopic && (!subjectId || t.subjectId === subjectId))
            ?.id
        : undefined;
      // Only send the fields this drawer edits; untouched columns keep their stored values.
      const updatedQuestion: Partial<Question> = {
        questionText: englishText || bengaliText,
        questionBengaliText: bengaliText,
        optionA: drawerOptions.A.trim(),
        optionB: drawerOptions.B.trim(),
        optionC: drawerOptions.C.trim(),
        optionD: drawerOptions.D.trim(),
        correctOption: drawerCorrectOption,
        // A Live Test question stays in its Live Test paper (its exam is not edited here).
        sourceExam: activeQuestion.isLiveOnly
          ? activeQuestion.sourceExam
          : drawerUploadMode === 'exam'
            ? drawerExam || undefined
            : '',
        isActive: drawerStatus === 'published',
        status: drawerStatus,
        tags: drawerTags,
        explanation: editExplanation.trim(),
        explanationBengali: editExplanationBengali.trim(),
      };
      // Subject / Topic belong to subject-wise questions only (not Exam or Live Test ones).
      const usesSubjectTopic = !activeQuestion.isLiveOnly && drawerUploadMode === 'subject';
      if (usesSubjectTopic && subjectId && subjectId !== activeQuestion.subjectId)
        updatedQuestion.subjectId = subjectId;
      if (
        usesSubjectTopic &&
        chapterId &&
        chapterId !== (activeQuestion.chapterId || activeQuestion.topicId)
      )
        updatedQuestion.chapterId = chapterId;
      if (drawerType !== originalType) {
        updatedQuestion.sourceType =
          drawerType === 'PYQ' ? 'pyq' : drawerType === 'Full Mock' ? 'other' : 'topic';
      }
      const nextYear = drawerYear ? Number(drawerYear) : undefined;
      // updateQuestion stores a falsy year as NULL, so 0 clears a previously saved year.
      if (nextYear !== activeQuestion.sourceYear) updatedQuestion.sourceYear = nextYear ?? 0;

      const savedQuestion = await api.updateQuestion(activeQuestion.id, updatedQuestion);

      setQuestions((prev) => prev.map((q) => (q.id === activeQuestion.id ? savedQuestion : q)));
      setActiveQuestion(savedQuestion);
      showToast(`Question #${activeQuestion.id} updated successfully!`);
    } catch (err) {
      showToast(`Error updating question: ${getErrorMessage(err, 'Failed to update')}`);
    } finally {
      setIsUpdatingDrawer(false);
    }
  };

  // Drawer Delete Handler
  const handleDeleteActiveQuestion = async () => {
    if (
      !activeQuestion ||
      !window.confirm('Permanently delete this question? Linked records are protected.')
    )
      return;
    try {
      const id = activeQuestion.id;
      await api.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setActiveQuestion(null);
      showToast('Question deleted in the backend.');
    } catch (err) {
      showToast(getErrorMessage(err, 'Delete failed'));
    }
  };

  // Add Tag in Drawer
  const handleAddDrawerTag = () => {
    if (newTagInput.trim() && !drawerTags.includes(newTagInput.trim())) {
      setDrawerTags([...drawerTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveDrawerTag = (tagToRemove: string) => {
    setDrawerTags(drawerTags.filter((t) => t !== tagToRemove));
  };

  // Shuffle Options in Drawer
  const handleShuffleDrawerOptions = () => {
    const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const currentCorrectText = drawerOptions[drawerCorrectOption];
    const values = [drawerOptions.A, drawerOptions.B, drawerOptions.C, drawerOptions.D].sort(
      () => Math.random() - 0.5
    );
    const newOpts: { [key: string]: string } = {
      A: values[0],
      B: values[1],
      C: values[2],
      D: values[3],
    };
    const newCorrect = keys.find((k) => newOpts[k] === currentCorrectText) || 'A';
    setDrawerOptions(newOpts);
    setDrawerCorrectOption(newCorrect);
    showToast('Options shuffled randomly.');
  };

  // Duplicate Detection Logic
  const checkDuplicate = (text: string) => {
    if (!text || text.length < 8) {
      setDuplicateWarning(null);
      return;
    }
    const cleanText = text.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
    for (const q of questions) {
      const existing = (q.questionBengaliText || q.questionText || '')
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09FF]/g, '');
      if (existing.length < 5) continue;
      if (cleanText.includes(existing) || existing.includes(cleanText)) {
        setDuplicateWarning({
          similarity: 94,
          existingText: q.questionBengaliText || q.questionText,
        });
        return;
      }
    }
    setDuplicateWarning(null);
  };

  // Handle Add Question Submission
  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAdd) return;
    if (!addQuestionBengali.trim() && !addQuestionEnglish.trim()) {
      showToast('Question text is required.');
      return;
    }
    if (!addOptA.trim() || !addOptB.trim()) {
      showToast('Options A and B are required.');
      return;
    }

    try {
      setIsSubmittingAdd(true);
      const newId = crypto.randomUUID();
      const newQuestionItem: Question = {
        id: newId,
        questionBengaliText: addQuestionBengali.trim(),
        questionText: addQuestionEnglish.trim() || addQuestionBengali.trim(),
        optionA: addOptA.trim(),
        optionB: addOptB.trim(),
        optionC: addOptC.trim() || 'None of the above',
        optionD: addOptD.trim() || 'All of the above',
        correctOption: addCorrect,
        uploadMode: modalUploadMode,
        sourceExam: modalUploadMode === 'exam' ? addExam : undefined,
        // Exam questions are not linked to a Subject / Topic.
        subjectName: modalUploadMode === 'subject' ? addSubject : undefined,
        topicName: modalUploadMode === 'subject' ? addTopic : undefined,
        chapterName: modalUploadMode === 'subject' ? addTopic : undefined,
        subtopic: addSubtopic || undefined,
        questionType:
          modalUploadMode === 'exam'
            ? addExamQuestionType === 'Official PYQ'
              ? 'PYQ'
              : 'Full Mock'
            : 'Topic',
        sourceType:
          modalUploadMode === 'exam'
            ? addExamQuestionType === 'Official PYQ'
              ? 'pyq'
              : 'other'
            : 'topic',
        sourceYear: modalUploadMode === 'exam' ? Number(addYear) : undefined,
        sourcePaper: modalUploadMode === 'exam' ? addPaper : undefined,
        section: modalUploadMode === 'exam' ? addSection : undefined,
        explanation: addExplanation.trim(),
        explanationBengali: addExplanation.trim(),
        shortNotes: addExplanation.trim(),
        tags: addTags.length > 0 ? addTags : [modalUploadMode === 'exam' ? addExam : addSubject],
        status: addStatus,
        isActive: addStatus === 'published',
        defaultMarks: addMarks,
        defaultNegativeMarks: addNegativeMarks,
        versionHistory: [
          {
            version: 1,
            editedBy: 'Super Admin',
            editedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            changes: 'Initial question creation',
          },
        ],
      };

      const savedQuestion = await api.createQuestion({
        ...newQuestionItem,
        subjectId:
          modalUploadMode === 'subject'
            ? subjects.find((s) => s.name === addSubject)?.id
            : undefined,
        chapterId:
          modalUploadMode === 'subject' ? topics.find((t) => t.name === addTopic)?.id : undefined,
      });
      setQuestions((prev) => [savedQuestion, ...prev]);
      setActiveQuestion(savedQuestion);
      setIsAddModalOpen(false);

      // Reset form
      setAddQuestionBengali('');
      setAddQuestionEnglish('');
      setAddOptA('');
      setAddOptB('');
      setAddOptC('');
      setAddOptD('');
      setAddExplanation('');
      setAddTags([]);
      setDuplicateWarning(null);
      showToast(`Question #${savedQuestion.id} created successfully!`);
    } catch (err) {
      showToast(`Error creating question: ${getErrorMessage(err, 'Failed to create')}`);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Download Templates (.CSV) with UTF-8 BOM for Bengali support
  const downloadTemplate = (mode: UploadMode, format: 'csv' | 'txt' = 'csv') => {
    if (format === 'txt') {
      downloadSampleTxt(`practicekoro_questions_${mode}_template.txt`);
      showToast(`Downloaded ${mode === 'exam' ? 'Exam' : 'Subject'} TXT Template.`);
      return;
    }

    let headers: string[] = [];
    let sampleRow: string[] = [];

    if (mode === 'exam') {
      headers = [
        'exam',
        'question_type',
        'year',
        'paper',
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_answer',
        'marks',
        'negative_marks',
        'explanation',
        'short_notes',
        'source',
        'tags',
      ];
      sampleRow = [
        'WBP Constable',
        'Official PYQ',
        '2025',
        'Set A',
        'ভারতের প্রথম গভর্নর-জেনারেল কে ছিলেন?',
        'Warren Hastings',
        'Lord Cornwallis',
        'Lord Wellesley',
        'Lord Canning',
        'A',
        '1.0',
        '0.25',
        '১৭৭৩ সালের রেগুলেটিং অ্যাক্টের মাধ্যমে ওয়ারেন হেস্টিংস গভর্নর-জেনারেল হন।',
        '• ১৭৭৩: রেগুলেটিং অ্যাক্ট\n• ওয়ারেন হেস্টিংস প্রথম গভর্নর-জেনারেল',
        'Official PYQ',
        'WBP;Modern India',
      ];
    } else {
      headers = [
        'subject',
        'topic',
        'subtopic',
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_answer',
        'marks',
        'negative_marks',
        'explanation',
        'short_notes',
        'source',
        'tags',
      ];
      sampleRow = [
        'General Science',
        'Chemical Reactions',
        'Water Chemistry',
        'H₂O এর রাসায়নিক নাম কি?',
        'Hydrogen Peroxide',
        'Dihydrogen Monoxide',
        'Hydrogen Dioxide',
        'Hydroxide Ion',
        'B',
        '1.0',
        '0.25',
        'জলের রাসায়নিক নাম হলো ডাইহাইড্রোজেন মনোক্সাইড।',
        '• সংকেত: H₂O\n• মোলার ভর: ১৮ গ্রাম',
        'Original',
        'Science;Chemistry',
      ];
    }

    const csvContent =
      '\uFEFF' +
      headers.join(',') +
      '\n' +
      sampleRow.map((v) => `"${v.replace(/"/g, '""')}"`).join(',');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `practicekoro_questions_${mode}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded ${mode === 'exam' ? 'Exam' : 'Subject'} CSV Template.`);
  };

  // Real File Upload Parser & Validator (Supports both .txt and .csv)
  const processImportFile = (file: File) => {
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const findSubject = (name: string) =>
        name
          ? subjects.find((sub) => sub.name.trim().toLowerCase() === name.toLowerCase())
          : undefined;
      const findTopic = (name: string, subjectId?: string) =>
        name
          ? topics.find(
              (t) =>
                t.name.trim().toLowerCase() === name.toLowerCase() &&
                (!subjectId || t.subjectId === subjectId)
            )
          : undefined;

      const isTxt =
        file.name.toLowerCase().endsWith('.txt') ||
        (!text.trim().toLowerCase().startsWith('exam,') &&
          !text.trim().toLowerCase().startsWith('subject,') &&
          /^(?:(?:Q(?:uestion)?\s*)?[0-9০-৯]+[-.:)]\s*)/m.test(text));

      // -----------------------------------------------------------------------
      // TXT Format Question Parser Handler
      // -----------------------------------------------------------------------
      if (isTxt) {
        const parsedTxt = parseQuestionsTxt(text);
        if (parsedTxt.totalDetected === 0) {
          setImportPreviewStats({
            total: 0,
            valid: 0,
            errors: 1,
            duplicates: 0,
            errorList: ['The uploaded TXT file contains no identifiable question blocks.'],
          });
          setParsedImportQuestions([]);
          return;
        }

        const parsed: Question[] = [];
        const errors: string[] = [];

        parsedTxt.errors.forEach((err) => {
          errors.push(`Question #${err.questionNumber}: ${err.reason}`);
        });

        const activeSubject =
          selectedSubjectFilter !== 'all' ? findSubject(selectedSubjectFilter) : undefined;
        const activeTopic =
          selectedTopicFilter !== 'all'
            ? findTopic(selectedTopicFilter, activeSubject?.id)
            : undefined;

        parsedTxt.valid.forEach((q) => {
          const base: Question = {
            id: crypto.randomUUID(),
            questionText: q.questionText,
            questionBengaliText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            uploadMode: importMode,
            status: 'published',
            isActive: true,
            defaultMarks: 1.0,
            defaultNegativeMarks: 0.25,
            explanationBengali: q.explanation,
            shortNotes: q.explanation || '',
            imageUrl: q.imageUrl,
            tags: [],
          };

          if (importMode === 'exam') {
            parsed.push({
              ...base,
              sourceExam: selectedExamFilter !== 'all' ? selectedExamFilter : undefined,
              sourceType: 'other',
            });
          } else {
            parsed.push({
              ...base,
              sourceType: 'topic',
              subjectName:
                activeSubject?.name ||
                (selectedSubjectFilter !== 'all' ? selectedSubjectFilter : undefined),
              subjectId: activeSubject?.id,
              topicName:
                activeTopic?.name ||
                (selectedTopicFilter !== 'all' ? selectedTopicFilter : undefined),
              topicId: activeTopic?.id,
            });
          }
        });

        setImportPreviewStats({
          total: parsedTxt.totalDetected,
          valid: parsed.length,
          errors: errors.length,
          duplicates: 0,
          errorList: errors.slice(0, 5),
        });
        setParsedImportQuestions(parsed);
        return;
      }

      // RFC 4180 parsing: quoted commas, multi-line fields and "" escapes.
      const csvRows = parseCsvRaw(text.replace(/^\uFEFF/, ''));

      if (csvRows.length <= 1) {
        setImportPreviewStats({
          total: 0,
          valid: 0,
          errors: 1,
          duplicates: 0,
          errorList: ['The uploaded file is empty or missing headers.'],
        });
        setParsedImportQuestions([]);
        return;
      }

      const rows = csvRows.slice(1);
      const parsed: Question[] = [];
      const errors: string[] = [];
      // Columns up to and including correct_answer are required in each template.
      const requiredColumns = modeIdx(importMode, 'correct') + 1;
      const toNumber = (value: string | undefined, fallback: number) => {
        if (!value?.trim()) return fallback;
        const n = Number(value);
        return Number.isFinite(n) && n >= 0 ? n : NaN;
      };

      rows.forEach((parts, idx) => {
        const rowLabel = `Row ${idx + 2}`;
        if (parts.length < requiredColumns) {
          errors.push(
            `${rowLabel}: expected at least ${requiredColumns} columns, found ${parts.length}`
          );
          return;
        }
        const qText = parts[modeIdx(importMode, 'question')];
        const optA = parts[modeIdx(importMode, 'optA')];
        const optB = parts[modeIdx(importMode, 'optB')];
        const optC = parts[modeIdx(importMode, 'optC')];
        const optD = parts[modeIdx(importMode, 'optD')];
        const correct = (parts[modeIdx(importMode, 'correct')] || '').trim().toUpperCase();

        if (!qText) {
          errors.push(`${rowLabel}: Question text is empty`);
          return;
        }
        if (!optA || !optB || !optC || !optD) {
          errors.push(`${rowLabel}: Options A, B, C and D are mandatory`);
          return;
        }
        if (!['A', 'B', 'C', 'D'].includes(correct)) {
          errors.push(
            `${rowLabel}: correct_answer must be A, B, C or D (got "${parts[modeIdx(importMode, 'correct')] || ''}")`
          );
          return;
        }
        const marks = toNumber(parts[modeIdx(importMode, 'marks')], 1);
        const negativeMarks = toNumber(parts[modeIdx(importMode, 'negativeMarks')], 0.25);
        if (Number.isNaN(marks) || Number.isNaN(negativeMarks)) {
          errors.push(`${rowLabel}: marks and negative_marks must be non-negative numbers`);
          return;
        }
        const tags = (parts[modeIdx(importMode, 'tags')] || '')
          .split(';')
          .map((t) => t.trim())
          .filter(Boolean);
        const explanation = parts[modeIdx(importMode, 'explanation')] || '';
        const shortNotes = parts[modeIdx(importMode, 'shortNotes')] || '';

        const base: Question = {
          id: crypto.randomUUID(),
          questionText: qText,
          optionA: optA,
          optionB: optB,
          optionC: optC,
          optionD: optD,
          correctOption: correct as 'A' | 'B' | 'C' | 'D',
          uploadMode: importMode,
          status: 'published',
          isActive: true,
          defaultMarks: marks,
          defaultNegativeMarks: negativeMarks,
          explanationBengali: explanation || undefined,
          shortNotes,
          tags,
        };

        if (importMode === 'exam') {
          const rawType = (parts[1] || '').trim().toLowerCase();
          const sourceType: Question['sourceType'] = !rawType
            ? undefined
            : rawType.includes('pyq')
              ? 'pyq'
              : rawType === 'topic'
                ? 'topic'
                : 'other';
          const rawYear = (parts[2] || '').trim();
          if (rawYear && !/^\d{4}$/.test(rawYear)) {
            errors.push(`${rowLabel}: year must be a 4-digit year (got "${rawYear}")`);
            return;
          }
          parsed.push({
            ...base,
            sourceExam: parts[0] || undefined,
            sourceType,
            sourceYear: rawYear ? Number(rawYear) : undefined,
            sourcePaper: parts[3] || undefined,
          });
        } else {
          const subjectName = parts[0] || '';
          const topicName = parts[1] || '';
          const subject = findSubject(subjectName);
          const topic = findTopic(topicName, subject?.id);
          parsed.push({
            ...base,
            sourceType: 'topic',
            subjectName: subjectName || undefined,
            subjectId: subject?.id,
            topicName: topicName || undefined,
            chapterName: topicName || undefined,
            chapterId: topic?.id,
            subtopic: parts[2] || undefined,
          });
        }
      });

      setParsedImportQuestions(parsed);
      setImportPreviewStats({
        total: rows.length,
        valid: parsed.length,
        errors: errors.length,
        duplicates: 0,
        errorList: errors.slice(0, 5),
      });
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImportFile(file);
  };

  const handleClearImportFile = () => {
    setImportFile(null);
    setParsedImportQuestions([]);
    setImportPreviewStats(null);
  };

  const modeIdx = (mode: UploadMode, field: string) => {
    if (mode === 'exam') {
      switch (field) {
        case 'question':
          return 4;
        case 'optA':
          return 5;
        case 'optB':
          return 6;
        case 'optC':
          return 7;
        case 'optD':
          return 8;
        case 'correct':
          return 9;
        case 'marks':
          return 10;
        case 'negativeMarks':
          return 11;
        case 'tags':
          return 15;
        case 'explanation':
          return 12;
        case 'shortNotes':
          return 13;
        default:
          return 0;
      }
    } else {
      switch (field) {
        case 'question':
          return 3;
        case 'optA':
          return 4;
        case 'optB':
          return 5;
        case 'optC':
          return 6;
        case 'optD':
          return 7;
        case 'correct':
          return 8;
        case 'marks':
          return 9;
        case 'negativeMarks':
          return 10;
        case 'tags':
          return 14;
        case 'explanation':
          return 11;
        case 'shortNotes':
          return 12;
        default:
          return 0;
      }
    }
  };

  // Execute Real Bulk Import with controlled concurrency, real IDs and error retention
  const handleExecuteImport = async () => {
    if (!parsedImportQuestions.length || isImporting) return;
    setIsImporting(true);
    try {
      const batch = await runConfirmedBatch(parsedImportQuestions, (q) => api.createQuestion(q));
      setQuestions((prev) => [...batch.results.map((r) => r.value), ...prev]);
      setParsedImportQuestions(batch.failures.map((f) => f.input));
      if (!batch.failures.length) {
        setIsImportModalOpen(false);
        setImportFile(null);
        setImportPreviewStats(null);
      }
      showToast(
        batch.results.length +
          ' saved; ' +
          batch.failures.length +
          ' failed.' +
          (batch.failures[0] ? ' ' + batch.failures[0].error : '')
      );
    } finally {
      setIsImporting(false);
    }
  };

  return {
    questions,
    setQuestions,
    exams,
    subjects,
    topics,
    filterTopicOptions,
    isLoading,
    activeUploadMode,
    setActiveUploadMode,
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
    loadInitialData,
    liveTests,
    liveQuestionIndex,
    liveTestTitleFor,
    selectedLiveTestFilter,
    setSelectedLiveTestFilter,
    isLiveUploadOpen,
    setIsLiveUploadOpen,
    selectedRowIds,
    setSelectedRowIds,
    activeQuestion,
    setActiveQuestion,
    drawerTab,
    setDrawerTab,
    drawerBengaliText,
    setDrawerBengaliText,
    drawerEnglishText,
    setDrawerEnglishText,
    drawerOptions,
    setDrawerOptions,
    drawerCorrectOption,
    setDrawerCorrectOption,
    drawerUploadMode,
    setDrawerUploadMode,
    drawerExam,
    setDrawerExam,
    drawerSubject,
    setDrawerSubject,
    drawerTopic,
    setDrawerTopic,
    drawerType,
    setDrawerType,
    drawerYear,
    setDrawerYear,
    drawerSource,
    setDrawerSource,
    drawerStatus,
    setDrawerStatus,
    drawerTags,
    newTagInput,
    setNewTagInput,
    isUpdatingDrawer,
    editExplanation,
    setEditExplanation,
    editExplanationBengali,
    setEditExplanationBengali,
    toastMessage,
    showToast,
    isAddMenuOpen,
    setIsAddMenuOpen,
    isAddModalOpen,
    setIsAddModalOpen,
    modalUploadMode,
    setModalUploadMode,
    addExam,
    setAddExam,
    addExamQuestionType,
    setAddExamQuestionType,
    addYear,
    setAddYear,
    addPaper,
    setAddPaper,
    addSection,
    setAddSection,
    addSubject,
    setAddSubject,
    addTopic,
    setAddTopic,
    addSubtopic,
    setAddSubtopic,
    addQuestionBengali,
    setAddQuestionBengali,
    addOptA,
    setAddOptA,
    addOptB,
    setAddOptB,
    addOptC,
    setAddOptC,
    addOptD,
    setAddOptD,
    addCorrect,
    setAddCorrect,
    addMarks,
    setAddMarks,
    addNegativeMarks,
    setAddNegativeMarks,
    addExplanation,
    setAddExplanation,
    addSource,
    setAddSource,
    addTags,
    setAddTags,
    addTagInput,
    setAddTagInput,
    addStatus,
    setAddStatus,
    duplicateWarning,
    setDuplicateWarning,
    isSubmittingAdd,
    isImportModalOpen,
    setIsImportModalOpen,
    importMode,
    setImportMode,
    importFile,
    setImportFile,
    setParsedImportQuestions,
    importPreviewStats,
    setImportPreviewStats,
    isImporting,
    isTemplateMenuOpen,
    setIsTemplateMenuOpen,
    activeActionMenuId,
    setActiveActionMenuId,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    drawerTopicNames,
    filteredQuestions,
    stats,
    totalPages,
    paginatedQuestions,
    handleSelectAll,
    handleToggleSelectRow,
    handleBulkStatusChange,
    handleBulkDelete,
    handleExportSelectedCSV,
    handleUpdateDrawer,
    handleDeleteActiveQuestion,
    handleAddDrawerTag,
    handleRemoveDrawerTag,
    handleShuffleDrawerOptions,
    checkDuplicate,
    handleCreateQuestionSubmit,
    downloadTemplate,
    handleFileChange,
    processImportFile,
    handleClearImportFile,
    handleExecuteImport,
  };
}

export type AdminQuestionBankState = ReturnType<typeof useAdminQuestionBank>;
