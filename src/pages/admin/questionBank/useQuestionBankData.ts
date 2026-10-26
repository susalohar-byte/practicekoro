import { useState, useEffect, useCallback } from 'react';
import { Question, Exam, Subject, Chapter, LiveTest } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_DEMO_QUESTIONS } from './demoQuestions';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';

/** Question Bank data: questions, taxonomy lists and Live Test papers loaded from the backend. */
export function useQuestionBankData(showToast: (msg: string) => void) {
  // Master Taxonomy & State
  const [questions, setQuestions] = useState<Question[]>(
    isSupabaseConfigured ? [] : INITIAL_DEMO_QUESTIONS
  );
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live Test mode: questions uploaded into Live Test papers (kept apart from Exam/Subject)
  const [liveTests, setLiveTests] = useState<LiveTest[]>([]);
  const [liveQuestionIndex, setLiveQuestionIndex] = useState<Record<string, string>>({});
  // Title of the Live Test a live question belongs to (for the table and the drawer)
  const liveTestTitleFor = useCallback(
    (questionId: string) => {
      const liveId = liveQuestionIndex[questionId];
      return liveTests.find((lt) => lt.id === liveId)?.title || 'Live Test';
    },
    [liveQuestionIndex, liveTests]
  );

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
    // showToast only calls stable state setters; keep loadInitialData stable as before.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    questions,
    setQuestions,
    exams,
    subjects,
    topics,
    isLoading,
    liveTests,
    liveQuestionIndex,
    liveTestTitleFor,
    loadInitialData,
  };
}
