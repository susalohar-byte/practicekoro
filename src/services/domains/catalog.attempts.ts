import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MOCK_QUESTIONS, MOCK_MISTAKES } from '@/services/mockData';
import type { AttemptStatus } from '@/types/database';
import type { AttemptAnswerState, TestAttempt, GradedResult } from '@/types';
import { calculateScore } from '@/utils/scoring';
import { resolveTestNegativeMarking } from '@/utils/negativeMarking';
import { localAttemptsStore } from '@/services/domains/localStore';
import type { AttemptRow } from '@/services/domains/localStore';
import type { catalogTestsApi } from '@/services/domains/catalog.tests';

// `this` is the assembled `catalogApi`; the test lookup lives in catalog.tests.
type CatalogTestLookup = Pick<typeof catalogTestsApi, 'getTestById'>;

/** Section of the student catalog API: starting, saving & submitting test attempts (split from domains/catalog.ts, same behaviour). */
export const catalogAttemptsApi = {
  async startTestAttempt(
    this: CatalogTestLookup,
    testId: string
  ): Promise<{
    attemptId: string;
    startTime: string;
    durationMinutes: number;
  }> {
    const test = await this.getTestById(testId);
    if (!test) throw new Error('Mock Test not found');

    const durationMinutes = test.durationMinutes;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('start_test_attempt', {
        p_test_id: testId,
      });

      if (error) {
        throw new Error(error.message || 'Failed to initialize exam session');
      }

      if (data && typeof data === 'object') {
        const res = data as { attempt_id: string; start_time: string; duration_minutes?: number };
        if (!res.attempt_id || !Number.isFinite(Date.parse(res.start_time)))
          throw new Error('Exam session creation was not confirmed');
        return {
          attemptId: res.attempt_id,
          startTime: res.start_time,
          durationMinutes: res.duration_minutes || durationMinutes,
        };
      }
    }

    if (isSupabaseConfigured) throw new Error('Exam session creation was not confirmed');

    // Local / Demo Fallback (Only active in development when Supabase is unconfigured)
    const existing = Object.values(localAttemptsStore).find(
      (a) => a.attempt.testId === testId && a.attempt.status === 'in_progress'
    );

    if (existing) {
      return {
        attemptId: existing.attempt.id,
        startTime: existing.attempt.startTime,
        durationMinutes,
      };
    }

    const attemptId = 'att-' + Date.now();
    const startTime = new Date().toISOString();

    localAttemptsStore[attemptId] = {
      attempt: {
        id: attemptId,
        userId: 'dev-student',
        testId,
        testTitle: test.title,
        status: 'in_progress',
        startTime,
        timeSpentSeconds: 0,
        score: 0,
        totalMarks: test.totalMarks,
        correctCount: 0,
        wrongCount: 0,
        skippedCount: 0,
        accuracy: 0,
        createdAt: startTime,
      },
      answers: {},
    };

    return { attemptId, startTime, durationMinutes };
  },

  async getTestAttempt(attemptId: string): Promise<TestAttempt | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('id', attemptId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message || 'Failed to fetch test attempt');
      }

      if (data) {
        const d = data as AttemptRow;
        return {
          id: d.id,
          userId: d.user_id,
          testId: d.test_id,
          status: d.status as AttemptStatus,
          startTime: d.start_time,
          endTime: d.end_time ?? undefined,
          timeSpentSeconds: d.time_spent_seconds,
          score: d.score,
          totalMarks: d.total_marks,
          correctCount: d.correct_count,
          wrongCount: d.wrong_count,
          skippedCount: d.skipped_count,
          accuracy: d.accuracy,
          rank: d.rank ?? undefined,
          percentile: d.percentile ?? undefined,
          createdAt: d.created_at,
        };
      }
      return null;
    }

    return localAttemptsStore[attemptId]?.attempt || null;
  },

  async saveAnswers(
    attemptId: string,
    answers: AttemptAnswerState[],
    timeSpentSeconds: number
  ): Promise<boolean> {
    let persisted = !isSupabaseConfigured;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('save_test_answers', {
          p_attempt_id: attemptId,
          p_answers: answers,
          p_time_spent_seconds: timeSpentSeconds,
        });
        persisted = !error && data === true;
      } catch (err) {
        console.warn('Autosave RPC failed:', err);
      }
    }

    // Local in-memory sync
    if (localAttemptsStore[attemptId]) {
      localAttemptsStore[attemptId].attempt.timeSpentSeconds = timeSpentSeconds;
      answers.forEach((ans) => {
        localAttemptsStore[attemptId].answers[ans.questionId] = ans;
      });
    }

    // Client recovery may be newer than this network response. Never overwrite
    // that newer snapshot when an older request completes.
    if (!isSupabaseConfigured) {
      try {
        localStorage.setItem(
          `practicekoro_attempt_${attemptId}`,
          JSON.stringify({ answers, timeSpentSeconds, updatedAt: Date.now() })
        );
      } catch {
        // Demo mode can continue without browser storage.
      }
    }

    return persisted;
  },

  async submitTestAttempt(
    this: CatalogTestLookup,
    attemptId: string,
    answers: AttemptAnswerState[],
    timeSpentSeconds: number,
    testId: string
  ): Promise<GradedResult> {
    const test = await this.getTestById(testId);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('submit_test_attempt', {
        p_attempt_id: attemptId,
        p_answers: answers,
        p_time_spent_seconds: timeSpentSeconds,
      });

      if (error) {
        throw new Error(error.message || 'Submission failed on server');
      }

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const res = data as Record<string, unknown>;
        const numericFields = [
          'score',
          'total_marks',
          'percentage',
          'accuracy',
          'correct_count',
          'wrong_count',
          'skipped_count',
        ];
        if (
          res.success === false ||
          !numericFields.every(
            (key) =>
              (typeof res[key] === 'number' ||
                (typeof res[key] === 'string' && res[key].trim() !== '')) &&
              Number.isFinite(Number(res[key]))
          ) ||
          Number(res.total_marks) <= 0 ||
          !['correct_count', 'wrong_count', 'skipped_count'].every(
            (key) => Number.isInteger(Number(res[key])) && Number(res[key]) >= 0
          ) ||
          Number(res.accuracy) < 0 ||
          Number(res.accuracy) > 100
        ) {
          throw new Error('Invalid grading response. Please retry submission.');
        }
        return {
          attemptId,
          testId,
          testTitle: test?.title,
          score: Number(res.score),
          totalMarks: Number(res.total_marks),
          percentage: Number(res.percentage),
          accuracy: Number(res.accuracy),
          correctCount: Number(res.correct_count),
          wrongCount: Number(res.wrong_count),
          skippedCount: Number(res.skipped_count),
          timeSpentSeconds,
          rank: res.rank !== undefined && res.rank !== null ? Number(res.rank) : null,
          totalCandidates: Number(res.total_candidates || 1),
          percentile:
            res.percentile !== undefined && res.percentile !== null ? Number(res.percentile) : null,
          passed: Boolean(res.passed),
        };
      }
    }

    if (isSupabaseConfigured) throw new Error('Test submission was not confirmed');

    // Local / Demo Authoritative fallback (only active when Supabase is unconfigured)
    const questions = MOCK_QUESTIONS[testId] || MOCK_QUESTIONS['test-indus-01'] || [];
    const answersMap = new Map(answers.map((a) => [a.questionId, a.selectedOption]));
    const totalMarks = test ? test.totalMarks : 5;
    const passingMarks = test?.passingMarks || 2;
    // Negative marking is test-level only for every supported type — never per-question.
    const effectiveNegative = resolveTestNegativeMarking(test?.testType, test?.negativeMarking);
    const scoreSummary = calculateScore(
      questions.map((q) => ({
        id: q.id,
        correctOption: q.correctOption,
        marks: q.defaultMarks || 1,
        negativeMarks: effectiveNegative,
      })),
      answers,
      totalMarks,
      passingMarks
    );

    // AUTOMATIC MISTAKES NOTEBOOK POPULATION (Local demo)
    questions.forEach((q) => {
      const selected = answersMap.get(q.id);
      if (selected && selected !== q.correctOption) {
        const existingMistake = MOCK_MISTAKES.find((m) => m.questionId === q.id);
        if (existingMistake) {
          existingMistake.wrongCount++;
          existingMistake.isResolved = false;
          existingMistake.lastReviewedAt = new Date().toISOString();
        } else {
          MOCK_MISTAKES.unshift({
            id: 'mst-' + Date.now() + '-' + q.id.slice(-4),
            userId: 'dev-student',
            questionId: q.id,
            question: q,
            wrongCount: 1,
            isResolved: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    const gradedResult: GradedResult = {
      attemptId,
      testId,
      testTitle: test?.title,
      score: scoreSummary.score,
      totalMarks,
      percentage: scoreSummary.percentage,
      accuracy: scoreSummary.accuracy,
      correctCount: scoreSummary.correctCount,
      wrongCount: scoreSummary.wrongCount,
      skippedCount: scoreSummary.skippedCount,
      timeSpentSeconds,
      rank: null,
      totalCandidates: 1,
      percentile: null,
      passed: scoreSummary.passed,
    };

    // Store in localAttemptsStore
    localAttemptsStore[attemptId] = {
      attempt: {
        id: attemptId,
        userId: 'dev-student',
        testId,
        testTitle: test?.title,
        status: 'completed',
        startTime: new Date(Date.now() - timeSpentSeconds * 1000).toISOString(),
        endTime: new Date().toISOString(),
        timeSpentSeconds,
        score: gradedResult.score,
        totalMarks: gradedResult.totalMarks,
        correctCount: scoreSummary.correctCount,
        wrongCount: scoreSummary.wrongCount,
        skippedCount: scoreSummary.skippedCount,
        accuracy: scoreSummary.accuracy,
        rank: null,
        percentile: null,
        createdAt: new Date().toISOString(),
      },
      answers: Object.fromEntries(answers.map((a) => [a.questionId, a])),
      result: gradedResult,
    };

    // Clean up local cache
    try {
      localStorage.removeItem(`practicekoro_attempt_${attemptId}`);
    } catch {
      // ignore
    }

    return gradedResult;
  },
};
