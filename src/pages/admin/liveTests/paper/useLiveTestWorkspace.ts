import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import type { LiveTest } from '@/types';
import { useAdminTestQuestions } from '../../testQuestions/useAdminTestQuestions';
import { ENDED_STATUSES } from './liveTestPaperUtils';

export interface LiveTestWorkspaceInnerProps {
  liveTest: LiveTest;
  onPublish: () => Promise<void>;
  onRelease: () => Promise<void>;
  busy: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
}

export function useLiveTestWorkspace({
  liveTest,
  onPublish,
  onRelease,
  busy,
  message,
}: LiveTestWorkspaceInnerProps) {
  const testQuestionsState = useAdminTestQuestions({
    testId: liveTest.testId,
    liveMode: true,
  });

  const {
    assignedQuestions,
    setAssignedQuestions,
    handleApplyDefaultsToAll,
    handleRemoveQuestion,
    handleSaveAssigned,
    isSaving,
    isSectionalOpen,
    isTestLocked,
    isLoading,
    moveQuestion,
    referencesLoading,
    saveError,
    saveMessage,
    saveSuccess,
    setIsBulkModalOpen,
    setIsCreateModalOpen,
    setIsSectionalOpen,
    setCreateError,
    setNewExplanation,
    setNewOptionA,
    setNewOptionB,
    setNewOptionC,
    setNewOptionD,
    setNewQuestionText,
    test,
    totalAssignedMarks,
    updateQuestionMarks,
  } = testQuestionsState;

  // View & Filter States
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedSample, setCopiedSample] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drawer Quick Edit States
  const [drawerTab, setDrawerTab] = useState<'preview' | 'edit'>('preview');
  const [editBengaliText, setEditBengaliText] = useState('');
  const [editEnglishText, setEditEnglishText] = useState('');
  const [editOptionA, setEditOptionA] = useState('');
  const [editOptionB, setEditOptionB] = useState('');
  const [editOptionC, setEditOptionC] = useState('');
  const [editOptionD, setEditOptionD] = useState('');
  const [editCorrectOption, setEditCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editExplanation, setEditExplanation] = useState('');
  const [editExplanationBengali, setEditExplanationBengali] = useState('');
  const [editMarks, setEditMarks] = useState<number>(1);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [drawerFeedback, setDrawerFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isDraft = liveTest.status === 'draft';
  const isEnded = ENDED_STATUSES.includes(liveTest.status);
  const isLiveOnly = Boolean(liveTest.test?.isLiveOnly ?? test?.isLiveOnly);

  // Targets from LiveTest with fallback to underlying MockTest
  const targetQuestionCount = liveTest.totalQuestions || test?.totalQuestions || 0;
  const targetMarks = liveTest.totalMarks || test?.totalMarks || 0;
  const durationMinutes = liveTest.durationMinutes || test?.durationMinutes || 60;
  const negativeMarking = liveTest.negativeMarking ?? test?.negativeMarking ?? 0;

  const completionPercentage =
    targetQuestionCount > 0
      ? Math.min(100, Math.round((assignedQuestions.length / targetQuestionCount) * 100))
      : 100;
  const isTargetAchieved =
    targetQuestionCount > 0 && assignedQuestions.length >= targetQuestionCount;

  // Active question references
  const activeQuestion = useMemo(() => {
    if (!activeQuestionId) return null;
    return assignedQuestions.find((q) => q.questionId === activeQuestionId) || null;
  }, [assignedQuestions, activeQuestionId]);

  const activeQuestionIndex = useMemo(() => {
    if (!activeQuestionId) return -1;
    return assignedQuestions.findIndex((q) => q.questionId === activeQuestionId);
  }, [assignedQuestions, activeQuestionId]);

  // Sync drawer edit form when active question changes
  useEffect(() => {
    if (activeQuestion) {
      setEditBengaliText(activeQuestion.questionBengaliText || '');
      setEditEnglishText(activeQuestion.questionText || '');
      setEditOptionA(activeQuestion.optionA || '');
      setEditOptionB(activeQuestion.optionB || '');
      setEditOptionC(activeQuestion.optionC || '');
      setEditOptionD(activeQuestion.optionD || '');
      setEditCorrectOption(
        (activeQuestion.correctOption?.toUpperCase() as 'A' | 'B' | 'C' | 'D') || 'A'
      );
      setEditExplanation(activeQuestion.explanation || '');
      setEditExplanationBengali(activeQuestion.explanationBengali || '');
      setEditMarks(activeQuestion.marks ?? 1);
      setDrawerTab('preview');
      setDrawerFeedback(null);
    }
  }, [activeQuestion]);

  // Unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const map = new Map<string, string>();
    assignedQuestions.forEach((q) => {
      if (q.subjectId && q.subjectName) {
        map.set(q.subjectId, q.subjectName);
      } else if (q.subjectName) {
        map.set(q.subjectName, q.subjectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [assignedQuestions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return assignedQuestions.filter((item) => {
      if (subjectFilter !== 'all') {
        const match =
          item.subjectId === subjectFilter ||
          item.subjectName?.toLowerCase() === subjectFilter.toLowerCase();
        if (!match) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.questionText?.toLowerCase().includes(q) ||
        item.questionBengaliText?.toLowerCase().includes(q) ||
        item.optionA?.toLowerCase().includes(q) ||
        item.optionB?.toLowerCase().includes(q) ||
        item.optionC?.toLowerCase().includes(q) ||
        item.optionD?.toLowerCase().includes(q) ||
        item.explanation?.toLowerCase().includes(q) ||
        item.explanationBengali?.toLowerCase().includes(q) ||
        item.subjectName?.toLowerCase().includes(q)
      );
    });
  }, [assignedQuestions, searchQuery, subjectFilter]);

  // Pagination calculation
  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  }, [filteredQuestions.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, subjectFilter, pageSize]);

  const paginatedQuestions = useMemo(() => {
    if (pageSize === 'all') return filteredQuestions;
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Drawer handlers
  const handlePrevQuestion = () => {
    if (activeQuestionIndex > 0) {
      const prevQ = assignedQuestions[activeQuestionIndex - 1];
      if (prevQ) setActiveQuestionId(prevQ.questionId);
    }
  };

  const handleNextQuestion = () => {
    if (activeQuestionIndex < assignedQuestions.length - 1) {
      const nextQ = assignedQuestions[activeQuestionIndex + 1];
      if (nextQ) setActiveQuestionId(nextQ.questionId);
    }
  };

  const handleMoveCurrentUp = () => {
    if (activeQuestionIndex > 0 && !isTestLocked) {
      moveQuestion(activeQuestionIndex, activeQuestionIndex - 1);
    }
  };

  const handleMoveCurrentDown = () => {
    if (activeQuestionIndex < assignedQuestions.length - 1 && !isTestLocked) {
      moveQuestion(activeQuestionIndex, activeQuestionIndex + 1);
    }
  };

  const handleRemoveCurrent = () => {
    if (activeQuestionIndex >= 0 && !isTestLocked) {
      handleRemoveQuestion(activeQuestionIndex);
      setActiveQuestionId(null);
    }
  };

  const handleSaveQuestionEdits = async () => {
    if (!activeQuestion || isTestLocked) return;
    try {
      setIsSavingQuestion(true);
      setDrawerFeedback(null);
      const updates = {
        questionText: editEnglishText,
        questionBengaliText: editBengaliText,
        optionA: editOptionA,
        optionB: editOptionB,
        optionC: editOptionC,
        optionD: editOptionD,
        correctOption: editCorrectOption,
        explanation: editExplanation,
        explanationBengali: editExplanationBengali,
      };
      await api.updateQuestion(activeQuestion.questionId, updates);

      setAssignedQuestions((prev) =>
        prev.map((q) =>
          q.questionId === activeQuestion.questionId
            ? {
                ...q,
                ...updates,
                marks: editMarks,
              }
            : q
        )
      );

      if (activeQuestionIndex >= 0 && editMarks !== activeQuestion.marks) {
        updateQuestionMarks(activeQuestionIndex, editMarks);
      }

      setDrawerFeedback({ type: 'success', text: 'Question updated successfully!' });
      setDrawerTab('preview');
      setTimeout(() => setDrawerFeedback(null), 3000);
    } catch (err) {
      setDrawerFeedback({
        type: 'error',
        text: getErrorMessage(err, 'Failed to update question.'),
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const openCreateQuestionModal = () => {
    if (isTestLocked) return;
    setNewQuestionText('');
    setNewOptionA('');
    setNewOptionB('');
    setNewOptionC('');
    setNewOptionD('');
    setNewExplanation('');
    setCreateError('');
    setIsCreateModalOpen(true);
  };

  return {
    liveTest,
    onPublish,
    onRelease,
    busy,
    message,
    testQuestionsState,
    activeQuestionId,
    setActiveQuestionId,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    subjectFilter,
    setSubjectFilter,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    copiedSample,
    setCopiedSample,
    copiedId,
    setCopiedId,
    drawerTab,
    setDrawerTab,
    editBengaliText,
    setEditBengaliText,
    editEnglishText,
    setEditEnglishText,
    editOptionA,
    setEditOptionA,
    editOptionB,
    setEditOptionB,
    editOptionC,
    setEditOptionC,
    editOptionD,
    setEditOptionD,
    editCorrectOption,
    setEditCorrectOption,
    editExplanation,
    setEditExplanation,
    editExplanationBengali,
    setEditExplanationBengali,
    editMarks,
    setEditMarks,
    isSavingQuestion,
    drawerFeedback,
    isDraft,
    isEnded,
    isLiveOnly,
    targetQuestionCount,
    targetMarks,
    durationMinutes,
    negativeMarking,
    completionPercentage,
    isTargetAchieved,
    activeQuestion,
    activeQuestionIndex,
    uniqueSubjects,
    filteredQuestions,
    totalPages,
    paginatedQuestions,
    handlePrevQuestion,
    handleNextQuestion,
    handleMoveCurrentUp,
    handleMoveCurrentDown,
    handleRemoveCurrent,
    handleSaveQuestionEdits,
    openCreateQuestionModal,
    assignedQuestions,
    handleApplyDefaultsToAll,
    handleRemoveQuestion,
    handleSaveAssigned,
    isSaving,
    isSectionalOpen,
    isTestLocked,
    isLoading,
    moveQuestion,
    referencesLoading,
    saveError,
    saveMessage,
    saveSuccess,
    setIsBulkModalOpen,
    setIsSectionalOpen,
    test,
    totalAssignedMarks,
    updateQuestionMarks,
  };
}

export type LiveTestWorkspaceState = ReturnType<typeof useLiveTestWorkspace>;
