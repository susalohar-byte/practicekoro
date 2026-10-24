import { useState, useEffect, useMemo } from 'react';
import type { MockTest, Question, Subject } from '@/types';

export interface UseTestQuestionSelectionArgs {
  test: MockTest | null;
  bankQuestions: Question[];
  assignedQuestionIds: Set<string>;
  testSubject: Subject | null;
}

export function useTestQuestionSelection({
  test,
  bankQuestions,
  assignedQuestionIds,
  testSubject,
}: UseTestQuestionSelectionArgs) {
  // ---------------------------------------------------------------------------
  // Question Selection States (Manage Questions Flow)
  // ---------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [countPreset, setCountPreset] = useState<number | 'custom'>(20);
  const [customCount, setCustomCount] = useState<number>(20);
  const [rangeFrom, setRangeFrom] = useState<number>(1);
  const [rangeTo, setRangeTo] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // ---------------------------------------------------------------------------
  // Context-Bound Eligible Question Bank Questions
  // ---------------------------------------------------------------------------
  const eligibleBankQuestions = useMemo(() => {
    if (!test) return [];

    return bankQuestions.filter((q) => {
      // 1. Context Matching
      if (test.testType === 'topic' || test.testType === 'chapter_mock') {
        const targetTopicId = test.chapterId || test.topicId;
        if (targetTopicId) {
          const matchTopic = q.chapterId === targetTopicId || q.topicId === targetTopicId;
          if (!matchTopic) return false;
        } else if (test.subjectId) {
          if (q.subjectId !== test.subjectId) return false;
        }
      } else if (test.testType === 'pyq') {
        if (test.year && q.sourceYear && q.sourceYear !== test.year) {
          return false;
        }
        if (test.examId && q.sourceExam && test.examTitle) {
          if (!q.sourceExam.toLowerCase().includes(test.examTitle.toLowerCase())) {
            return false;
          }
        }
      } else if (test.testType === 'full_mock') {
        if (test.examId && q.sourceExam && test.examTitle) {
          const isExamMatch = q.sourceExam.toLowerCase().includes(test.examTitle.toLowerCase());
          if (!isExamMatch && q.subjectId && testSubject?.id && q.subjectId !== testSubject.id) {
            return false;
          }
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase().trim();
        const eng = q.questionText.toLowerCase().includes(term);
        const ben = q.questionBengaliText && q.questionBengaliText.toLowerCase().includes(term);
        if (!eng && !ben) return false;
      }

      return true;
    });
  }, [test, bankQuestions, searchQuery, testSubject]);

  // Unassigned eligible questions in this context
  const unassignedEligibleQuestions = useMemo(() => {
    return eligibleBankQuestions.filter((q) => !assignedQuestionIds.has(q.id));
  }, [eligibleBankQuestions, assignedQuestionIds]);

  // Paginated questions for the UI view
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return eligibleBankQuestions.slice(start, start + pageSize);
  }, [eligibleBankQuestions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(eligibleBankQuestions.length / pageSize));

  // Keep currentPage within bounds when eligible questions change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ---------------------------------------------------------------------------
  // Multi-Select & Random Selection Handlers
  // ---------------------------------------------------------------------------
  const handleToggleSelectQuestion = (id: string) => {
    if (assignedQuestionIds.has(id)) return; // Prevent selecting already added questions
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const unassignedIds = unassignedEligibleQuestions.map((q) => q.id);
    setSelectedQuestionIds(unassignedIds);
  };

  const handleClearSelection = () => {
    setSelectedQuestionIds([]);
  };

  const handleSelectRandom = () => {
    const targetCount = countPreset === 'custom' ? customCount : countPreset;
    if (targetCount <= 0) return;

    // Pull from all eligible questions that are NOT already in the test
    const pool = [...unassignedEligibleQuestions];
    if (pool.length === 0) return;

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const pickedIds = pool.slice(0, targetCount).map((q) => q.id);
    setSelectedQuestionIds(pickedIds);
  };

  // Computed batch segments for range selection (fixed 10-by-10 batches: 1-10, 11-20, 21-30, 31-40...)
  const quickRangeBatches = useMemo(() => {
    const total = eligibleBankQuestions.length;
    if (total === 0) return [];
    const step = 10; // Fixed 10 questions per batch (1-10, 11-20, 21-30...)
    const batches: { from: number; to: number; label: string }[] = [];
    for (let i = 1; i <= total; i += step) {
      const to = Math.min(i + step - 1, total);
      batches.push({ from: i, to, label: `${i} - ${to}` });
    }
    return batches;
  }, [eligibleBankQuestions.length]);

  const handleSelectRange = (fromNum?: number, toNum?: number) => {
    const total = eligibleBankQuestions.length;
    if (total === 0) return;

    const rawFrom = fromNum !== undefined ? fromNum : rangeFrom;
    const rawTo = toNum !== undefined ? toNum : rangeTo;

    const from = Math.max(1, Math.min(rawFrom, rawTo));
    const to = Math.min(total, Math.max(rawFrom, rawTo));

    setRangeFrom(from);
    setRangeTo(to);

    // Slice from index (from - 1) to (to)
    const targetSlice = eligibleBankQuestions.slice(from - 1, to);
    const unassignedSlice = targetSlice.filter((q) => !assignedQuestionIds.has(q.id));

    if (unassignedSlice.length === 0) {
      return;
    }

    const unassignedIds = unassignedSlice.map((q) => q.id);
    setSelectedQuestionIds(unassignedIds);

    // Jump pagination to the page of the first selected item
    const targetPage = Math.ceil(from / pageSize);
    if (targetPage >= 1 && targetPage <= totalPages) {
      setCurrentPage(targetPage);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedQuestionIds,
    setSelectedQuestionIds,
    countPreset,
    setCountPreset,
    customCount,
    setCustomCount,
    rangeFrom,
    setRangeFrom,
    rangeTo,
    setRangeTo,
    currentPage,
    setCurrentPage,
    pageSize,
    eligibleBankQuestions,
    unassignedEligibleQuestions,
    paginatedQuestions,
    totalPages,
    handleToggleSelectQuestion,
    handleSelectAll,
    handleClearSelection,
    handleSelectRandom,
    quickRangeBatches,
    handleSelectRange,
  };
}
