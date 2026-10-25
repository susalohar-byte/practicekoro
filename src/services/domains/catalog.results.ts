import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  MOCK_SUBJECTS,
  MOCK_CHAPTERS,
  MOCK_QUESTIONS,
  MOCK_ATTEMPTS,
  MOCK_BOOKMARKS,
} from '@/services/mockData';
import type { AttemptRankings, GradedResult, QuestionSolution } from '@/types';
import { resolveTestNegativeMarking } from '@/utils/negativeMarking';
import { localAttemptsStore, localTests } from '@/services/domains/localStore';

/** Section of the student catalog API: attempt results, rankings, solutions & negative marks (split from domains/catalog.ts, same behaviour). */
export const catalogResultsApi = {
  async getAttemptResult(attemptId: string): Promise<GradedResult | null> {
    if (isSupabaseConfigured) {
      const { data: res, error } = await supabase
        .from('test_results')
        .select(
          `
          score,
          total_marks,
          percentage,
          accuracy,
          rank,
          total_candidates,
          percentile,
          passed,
          test_id,
          test_attempts (
            correct_count,
            wrong_count,
            skipped_count,
            time_spent_seconds
          ),
          tests (
            title
          )
        `
        )
        .eq('attempt_id', attemptId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message || 'Failed to fetch test result');
      }

      if (res) {
        const r = res as Record<string, unknown>;
        const attempt = r.test_attempts as {
          correct_count: number;
          wrong_count: number;
          skipped_count: number;
          time_spent_seconds: number;
        } | null;
        const test = r.tests as { title: string } | null;

        return {
          attemptId,
          testId: String(r.test_id),
          testTitle: test?.title,
          score: Number(r.score),
          totalMarks: Number(r.total_marks),
          percentage: Number(r.percentage || 0),
          accuracy: Number(r.accuracy || 0),
          correctCount: Number(attempt?.correct_count || 0),
          wrongCount: Number(attempt?.wrong_count || 0),
          skippedCount: Number(attempt?.skipped_count || 0),
          timeSpentSeconds: Number(attempt?.time_spent_seconds || 0),
          rank: r.rank !== null && r.rank !== undefined ? Number(r.rank) : null,
          totalCandidates: Number(r.total_candidates || 1),
          percentile:
            r.percentile !== null && r.percentile !== undefined ? Number(r.percentile) : null,
          passed: Boolean(r.passed),
        };
      }
      return null;
    }

    if (localAttemptsStore[attemptId]?.result) {
      return localAttemptsStore[attemptId].result!;
    }

    // Check attempts in mock list
    const attempt = MOCK_ATTEMPTS.find((a) => a.id === attemptId);
    if (attempt) {
      return {
        attemptId: attempt.id,
        testId: attempt.testId,
        testTitle: attempt.testTitle,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: Number(((attempt.score / attempt.totalMarks) * 100).toFixed(1)),
        accuracy: attempt.accuracy,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        skippedCount: attempt.skippedCount,
        timeSpentSeconds: attempt.timeSpentSeconds,
        rank: attempt.rank ?? null,
        totalCandidates: 1,
        percentile: attempt.percentile ?? null,
        passed: attempt.score >= 2,
      };
    }

    return null;
  },

  async getAttemptRankings(attemptId: string): Promise<AttemptRankings | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase.rpc('get_attempt_rankings', {
      p_attempt_id: attemptId,
    });
    if (error) throw new Error(error.message || 'Failed to load rankings');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data as unknown as AttemptRankings;
  },

  async getAttemptSolutions(attemptId: string, testId: string): Promise<QuestionSolution[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('get_attempt_solutions', {
        p_attempt_id: attemptId,
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch solutions');
      }

      if (Array.isArray(data)) {
        return data as QuestionSolution[];
      }
      return [];
    }

    // Local / Demo fallback
    const questions = MOCK_QUESTIONS[testId] || MOCK_QUESTIONS['test-indus-01'] || [];
    const answersMap = localAttemptsStore[attemptId]?.answers || {};
    const allSubjects = Object.values(MOCK_SUBJECTS).flat();
    const allChapters = Object.values(MOCK_CHAPTERS).flat();
    const demoTest = localTests.find((test) => test.id === testId);
    const negativePerWrong = resolveTestNegativeMarking(
      demoTest?.testType,
      demoTest?.negativeMarking
    );

    return questions.map((q, idx) => {
      const ans = answersMap[q.id];
      const selected = ans?.selectedOption || null; // Strictly real answer or null; never guess
      const isCorrect = selected !== null && selected === q.correctOption;
      const marksAwarded = isCorrect ? q.defaultMarks : selected ? -negativePerWrong : 0;

      return {
        id: q.id,
        questionOrder: idx + 1,
        questionText: q.questionText,
        questionBengaliText: q.questionBengaliText,
        imageUrl: q.imageUrl,
        subjectId: q.subjectId,
        subjectName:
          q.subjectName ||
          (q.subjectId ? allSubjects.find((s) => s.id === q.subjectId)?.name : undefined),
        chapterId: q.chapterId,
        chapterName:
          q.chapterName ||
          (q.chapterId ? allChapters.find((c) => c.id === q.chapterId)?.name : undefined),
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        selectedOption: selected,
        correctOption: q.correctOption,
        isCorrect,
        marksAwarded,
        explanation: q.explanation,
        explanationBengali: q.explanationBengali,
        isBookmarked: MOCK_BOOKMARKS.some((b) => b.questionId === q.id),
      };
    });
  },

  async getAttemptNegativeMarks(attemptId: string, testId: string): Promise<number> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('attempt_answers')
        .select('marks_awarded')
        .eq('attempt_id', attemptId);

      if (error) {
        throw new Error(error.message || 'Failed to fetch negative marks');
      }

      return (data || []).reduce(
        (total, answer) => total + Math.max(0, -Number(answer.marks_awarded || 0)),
        0
      );
    }

    const solutions = await this.getAttemptSolutions(attemptId, testId);
    return solutions.reduce(
      (total, solution) => total + Math.max(0, -Number(solution.marksAwarded || 0)),
      0
    );
  },
};
