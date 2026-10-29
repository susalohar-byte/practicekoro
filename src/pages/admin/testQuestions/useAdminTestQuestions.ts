import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type { MockTest, Question, TestQuestionAssignment, Subject, Chapter, Exam } from '@/types';
import { resolveTestNegativeMarking } from '@/utils/negativeMarking';
import { getErrorMessage } from '@/lib/errors';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { useTestQuestionSelection } from './useTestQuestionSelection';
import { useBulkTxtImport } from './useBulkTxtImport';
import { useCreateTestQuestion } from './useCreateTestQuestion';

export interface UseAdminTestQuestionsOptions {
  /** Load this test instead of the `:testId` route param. */
  testId?: string;
  /**
   * Live Test paper workspace (opened from the Live Tests page): no switching to other tests
   * and no picking questions from the Question Bank; questions are uploaded into the paper.
   */
  liveMode?: boolean;
}

export function useAdminTestQuestions(options: UseAdminTestQuestionsOptions = {}) {
  const { testId: routeParamTestId } = useParams<{ testId: string }>();
  const routeTestId = options.testId || routeParamTestId;
  const liveMode = Boolean(options.liveMode);
  const navigate = useNavigate();
  const { isBilingualEnabled } = useContentLanguage();

  // ---------------------------------------------------------------------------
  // Data States
  // ---------------------------------------------------------------------------
  const [allTests, setAllTests] = useState<MockTest[]>([]);
  const [currentTestId, setCurrentTestId] = useState<string>(routeTestId || '');
  const [test, setTest] = useState<MockTest | null>(null);
  const [assignedQuestions, setAssignedQuestions] = useState<TestQuestionAssignment[]>([]);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [referencesLoading, setReferencesLoading] = useState(true);

  // View Mode: 'assigned' (Questions currently in test) vs 'select' (Question Bank selector)
  const [activeTab, setActiveTab] = useState<'assigned' | 'select'>('assigned');

  // Save / Action Notifications
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  // Sync route param with state
  useEffect(() => {
    if (routeTestId && routeTestId !== currentTestId) {
      setCurrentTestId(routeTestId);
    }
  }, [routeTestId, currentTestId]);

  // Load tests list
  useEffect(() => {
    if (liveMode) {
      // A Live Test paper is never switched for another test.
      setReferencesLoading(false);
      return;
    }
    const fetchTests = async () => {
      setReferencesLoading(true);
      try {
        const tests = await api.getAllAdminTests();
        setAllTests(tests);
        if (!routeTestId && tests.length > 0) {
          setCurrentTestId(tests[0].id);
        }
      } catch (err) {
        console.error('Error loading tests list:', err);
      } finally {
        setReferencesLoading(false);
      }
    };
    fetchTests();
  }, [routeTestId, liveMode]);

  const [isTestLocked, setIsTestLocked] = useState(false);
  const [lockCheckError, setLockCheckError] = useState('');

  // Load test details, assigned questions, question bank, and taxonomy
  const loadData = useCallback(async () => {
    if (!currentTestId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [testData, assigned, allSubjects, allChapters, allExams, locked] = await Promise.all([
        api.getTestById(currentTestId),
        api.getTestAssignedQuestions(currentTestId),
        api.getAllAdminSubjects(),
        api.getAllAdminChapters(),
        api.getAllAdminExams(),
        // Fail closed: if the live-test lock cannot be verified, treat the test as locked.
        api.isTestLockedForEditing(currentTestId).then(
          (isLocked) => ({ isLocked, error: '' }),
          (err) => ({
            isLocked: true,
            error: getErrorMessage(err, 'Live Test lock status could not be verified.'),
          })
        ),
      ]);

      setTest(testData);
      setAssignedQuestions(assigned);
      // The bank selector list is (re)loaded on demand by the effect below.
      setBankQuestions([]);
      setBankLoadedFor('');
      setBankVersion((v) => v + 1);
      setSubjects(allSubjects);
      setChapters(allChapters);
      setExams(allExams);
      setIsTestLocked(Boolean(locked.isLocked));
      setLockCheckError(locked.error);

      // If the test has 0 questions (freshly created), default directly to question selection
      if (assigned.length === 0 && !liveMode) {
        setActiveTab('select');
      }
    } catch (err) {
      console.error('Error loading test questions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentTestId, liveMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Question Bank selector rows: fetched only when the "select" tab is open (never for a Live
  // Test paper), and narrowed on the server to the test's topic / exam context.
  const [bankVersion, setBankVersion] = useState(0);
  const [bankLoadedFor, setBankLoadedFor] = useState('');
  const [bankLoading, setBankLoading] = useState(false);
  useEffect(() => {
    if (liveMode || activeTab !== 'select' || !test || isLoading) return;
    const key = `${test.id}:${bankVersion}`;
    if (bankLoadedFor === key) return;
    let cancelled = false;
    setBankLoading(true);
    api
      .getAdminQuestionsForTestContext({
        testType: test.testType,
        chapterId: test.chapterId,
        topicId: test.topicId,
        subjectId: test.subjectId,
        year: test.year,
        examId: test.examId,
        examTitle: test.examTitle,
        testSubjectId: subjects.find((s) => s.id === test.subjectId)?.id,
      })
      .then((bank) => {
        if (cancelled) return;
        setBankQuestions(bank);
        setBankLoadedFor(key);
        setBankLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error loading question bank:', err);
        setBankLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [liveMode, activeTab, test, isLoading, subjects, bankVersion, bankLoadedFor]);

  const handleSelectTest = (id: string) => {
    if (liveMode) return;
    setCurrentTestId(id);
    navigate(`/admin/tests/${id}/questions`);
  };

  // ---------------------------------------------------------------------------
  // Context-Aware Metadata Detection
  // ---------------------------------------------------------------------------
  const testSubject = useMemo(() => {
    if (!test?.subjectId) return null;
    return subjects.find((s) => s.id === test.subjectId) || null;
  }, [test, subjects]);

  const testChapter = useMemo(() => {
    const chapterId = test?.chapterId || test?.topicId;
    if (!chapterId) return null;
    return chapters.find((c) => c.id === chapterId) || null;
  }, [test, chapters]);

  const testExam = useMemo(() => {
    if (!test?.examId) return null;
    return exams.find((e) => e.id === test.examId) || null;
  }, [test, exams]);

  // Only show tests created in this same Topic (or same Exam for Full Mock/PYQ)
  const availableSwitchTests = useMemo(() => {
    if (liveMode) return [];
    if (!test) return allTests;

    if (test.testType === 'topic' || test.testType === 'chapter_mock') {
      const targetTopicId = test.chapterId || test.topicId;
      const targetTopicName = (test.chapterName || test.topicName || testChapter?.name || '')
        .trim()
        .toLowerCase();

      const matching = allTests.filter((t) => {
        const isTopic =
          t.testType === 'topic' ||
          t.testType === 'chapter_mock' ||
          (!t.testType && (t.chapterId || t.topicId));
        if (!isTopic) return false;

        if (targetTopicId && (t.chapterId === targetTopicId || t.topicId === targetTopicId)) {
          return true;
        }
        if (targetTopicName) {
          const tName = (t.chapterName || t.topicName || '').trim().toLowerCase();
          if (tName && tName === targetTopicName) return true;
        }
        return false;
      });

      if (matching.length > 0) return matching;
      return [test];
    } else if (test.testType === 'full_mock' || test.testType === 'pyq') {
      if (test.examId) {
        const matching = allTests.filter(
          (t) =>
            t.testType === test.testType &&
            (t.examId === test.examId || t.associatedExamIds?.includes(test.examId!))
        );
        if (matching.length > 0) return matching;
      }
      return [test];
    }

    return allTests.filter((t) => t.id === test.id);
  }, [test, allTests, testChapter, liveMode]);

  // Set of already assigned Question IDs for this test
  const assignedQuestionIds = useMemo(() => {
    return new Set(assignedQuestions.map((q) => q.questionId));
  }, [assignedQuestions]);

  // ---------------------------------------------------------------------------
  // Question Selection (Manage Questions Flow)
  // ---------------------------------------------------------------------------
  const selection = useTestQuestionSelection({
    test,
    bankQuestions,
    assignedQuestionIds,
    testSubject,
  });
  const { selectedQuestionIds, setSelectedQuestionIds } = selection;

  // ---------------------------------------------------------------------------
  // Add Selected Questions to Test
  // ---------------------------------------------------------------------------
  const handleAddSelectedQuestions = async () => {
    if (selectedQuestionIds.length === 0 || !test || isTestLocked) return;
    const previousAssigned = assignedQuestions;
    const previousSelection = selectedQuestionIds;

    const questionsToAdd = bankQuestions.filter((q) => selectedQuestionIds.includes(q.id));
    const defMarks =
      test.totalMarks && test.totalQuestions
        ? Number((test.totalMarks / test.totalQuestions).toFixed(2))
        : 1.0;
    const defNeg = resolveTestNegativeMarking(test.testType, test.negativeMarking);

    const newAssignments: TestQuestionAssignment[] = questionsToAdd.map((q, idx) => ({
      questionId: q.id,
      questionOrder: assignedQuestions.length + idx + 1,
      marks: q.defaultMarks || defMarks,
      // Negative marking always follows the test-level scheme (never per-question).
      negativeMarks: defNeg,
      questionText: q.questionText,
      questionBengaliText: q.questionBengaliText,
      correctOption: q.correctOption,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      explanation: q.explanation,
      explanationBengali: q.explanationBengali,
      difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    }));

    const updated = [...assignedQuestions, ...newAssignments];
    setAssignedQuestions(updated);
    setSelectedQuestionIds([]);

    try {
      setIsSaving(true);
      setSaveError('');
      const payload = updated.map((q, idx) => ({
        questionId: q.questionId,
        orderIndex: idx + 1,
        marks: q.marks,
        // Negative marking always follows the test-level scheme (never per-question).
        negativeMarks: resolveTestNegativeMarking(test.testType, test.negativeMarking),
      }));

      const res = await api.saveTestQuestions(test.id, payload);
      if (res.success) {
        setSaveSuccess(true);
        setSaveMessage(
          `Successfully attached ${questionsToAdd.length} questions to ${test.title}!`
        );
        setTimeout(() => setSaveSuccess(false), 4000);
        const updatedTest = await api.getTestById(test.id);
        if (updatedTest) setTest(updatedTest);
        setActiveTab('assigned'); // Switch to view the updated questions list
      } else {
        // Roll back the optimistic add so the list matches what is saved.
        setAssignedQuestions(previousAssigned);
        setSelectedQuestionIds(previousSelection);
        setSaveError(res.error || 'Failed to attach questions to test.');
      }
    } catch (err) {
      setAssignedQuestions(previousAssigned);
      setSelectedQuestionIds(previousSelection);
      setSaveError(getErrorMessage(err, 'Failed to save test questions'));
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Manage Assigned Questions (Reorder, Marks, Remove)
  // ---------------------------------------------------------------------------
  const moveQuestion = (fromIndex: number, toIndex: number) => {
    if (isTestLocked || toIndex < 0 || toIndex >= assignedQuestions.length) return;
    const updated = [...assignedQuestions];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    const reordered = updated.map((q, idx) => ({ ...q, questionOrder: idx + 1 }));
    setAssignedQuestions(reordered);
    setSaveSuccess(false);
  };

  const handleRemoveQuestion = async (index: number) => {
    if (!test || isTestLocked) return;
    const updated = assignedQuestions.filter((_, idx) => idx !== index);
    const reordered = updated.map((q, idx) => ({ ...q, questionOrder: idx + 1 }));

    try {
      setIsSaving(true);
      const payload = reordered.map((q, idx) => ({
        questionId: q.questionId,
        orderIndex: idx + 1,
        marks: q.marks,
        // Negative marking always follows the test-level scheme (never per-question).
        negativeMarks: resolveTestNegativeMarking(test.testType, test.negativeMarking),
      }));

      const saved = await api.saveTestQuestions(test.id, payload);
      if (!saved.success) throw new Error(saved.error || 'Assignment save failed.');
      setAssignedQuestions(reordered);
      const updatedTest = await api.getTestById(test.id);
      if (updatedTest) setTest(updatedTest);

      setSaveSuccess(true);
      setSaveMessage('Question removed from test. It remains safe in Question Bank.');
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Failed to update test questions'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuestionMarks = (index: number, marks: number) => {
    const updated = [...assignedQuestions];
    updated[index] = {
      ...updated[index],
      marks,
      // Negative marking always follows the test-level scheme (never per-question).
      negativeMarks: resolveTestNegativeMarking(test?.testType, test?.negativeMarking),
    };
    setAssignedQuestions(updated);
    setSaveSuccess(false);
  };

  const handleApplyDefaultsToAll = () => {
    const defMarks =
      test?.totalMarks && test?.totalQuestions
        ? Number((test.totalMarks / test.totalQuestions).toFixed(2))
        : 1.0;
    const defNeg = resolveTestNegativeMarking(test?.testType, test?.negativeMarking);
    setAssignedQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        marks: defMarks,
        negativeMarks: defNeg,
      }))
    );
    setSaveSuccess(false);
  };

  // Sectional Marking States & Logic
  const assignedSections = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    assignedQuestions.forEach((q) => {
      const sId = q.subjectId || 'general';
      const sName =
        q.subjectName || subjects.find((s) => s.id === q.subjectId)?.name || 'General Section';
      if (!map.has(sId)) {
        map.set(sId, { id: sId, name: sName, count: 1 });
      } else {
        map.get(sId)!.count++;
      }
    });
    return Array.from(map.values());
  }, [assignedQuestions, subjects]);

  const [sectionalSubjectId, setSectionalSubjectId] = useState<string>('');
  const [sectionalMarks, setSectionalMarks] = useState<number>(1);
  const [isSectionalOpen, setIsSectionalOpen] = useState(false);

  // Set default sectional subject when assignedSections updates
  useEffect(() => {
    if (assignedSections.length > 0 && !sectionalSubjectId) {
      setSectionalSubjectId(assignedSections[0].id);
    }
  }, [assignedSections, sectionalSubjectId]);

  const handleApplySectionalMarks = () => {
    if (!sectionalSubjectId) {
      alert('Please select a section / subject.');
      return;
    }
    setAssignedQuestions((prev) =>
      prev.map((q) => {
        const qSubId = q.subjectId || 'general';
        if (sectionalSubjectId === 'all' || qSubId === sectionalSubjectId) {
          return {
            ...q,
            marks: Number(sectionalMarks),
            // Negative marking always follows the test-level scheme (never per-question).
            negativeMarks: resolveTestNegativeMarking(test?.testType, test?.negativeMarking),
          };
        }
        return q;
      })
    );
    setSaveSuccess(true);
    setSaveMessage(`Applied ${sectionalMarks} Marks to selected section questions.`);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveAssigned = async () => {
    if (!currentTestId || isTestLocked) return;
    try {
      setIsSaving(true);
      setSaveError('');
      const payload = assignedQuestions.map((q, idx) => ({
        questionId: q.questionId,
        orderIndex: idx + 1,
        marks: q.marks,
        // Negative marking always follows the test-level scheme (never per-question).
        negativeMarks: resolveTestNegativeMarking(test?.testType, test?.negativeMarking),
      }));

      const res = await api.saveTestQuestions(currentTestId, payload);
      if (res.success) {
        setSaveSuccess(true);
        setSaveMessage('Test questions order and scoring saved successfully!');
        setTimeout(() => setSaveSuccess(false), 4000);
        const updatedTest = await api.getTestById(currentTestId);
        if (updatedTest) setTest(updatedTest);
      } else {
        setSaveError(res.error || 'Failed to save test questions');
      }
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Error saving questions'));
    } finally {
      setIsSaving(false);
    }
  };

  const bulkImport = useBulkTxtImport({ test, loadData });

  const createQuestion = useCreateTestQuestion({
    currentTestId,
    test,
    isBilingualEnabled,
    loadData,
    setSaveSuccess,
    setSaveMessage,
  });

  const totalAssignedMarks = assignedQuestions.reduce((acc, q) => acc + (q.marks || 0), 0);

  return {
    ...selection,
    ...bulkImport,
    ...createQuestion,
    isBilingualEnabled,
    liveMode,
    allTests,
    setAllTests,
    currentTestId,
    setCurrentTestId,
    test,
    setTest,
    assignedQuestions,
    setAssignedQuestions,
    bankQuestions,
    setBankQuestions,
    bankLoading,
    subjects,
    setSubjects,
    chapters,
    setChapters,
    exams,
    setExams,
    isLoading,
    setIsLoading,
    referencesLoading,
    setReferencesLoading,
    activeTab,
    setActiveTab,
    isSaving,
    setIsSaving,
    saveSuccess,
    setSaveSuccess,
    saveMessage,
    setSaveMessage,
    saveError,
    setSaveError,
    isTestLocked,
    setIsTestLocked,
    lockCheckError,
    setLockCheckError,
    loadData,
    handleSelectTest,
    testSubject,
    testChapter,
    testExam,
    availableSwitchTests,
    assignedQuestionIds,
    handleAddSelectedQuestions,
    moveQuestion,
    handleRemoveQuestion,
    updateQuestionMarks,
    handleApplyDefaultsToAll,
    assignedSections,
    sectionalSubjectId,
    setSectionalSubjectId,
    sectionalMarks,
    setSectionalMarks,
    isSectionalOpen,
    setIsSectionalOpen,
    handleApplySectionalMarks,
    handleSaveAssigned,
    totalAssignedMarks,
  };
}

export type AdminTestQuestionsState = ReturnType<typeof useAdminTestQuestions>;
