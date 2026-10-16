import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AttemptAnswerState, StudentTestQuestion } from '@/types';

const m = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  queryLog: [] as unknown[][],
  result: { data: null as unknown, error: null as { message: string } | null },
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { rpc: m.rpc, from: m.from },
}));

import { catalogApi } from './catalog';

const answer: AttemptAnswerState = {
  questionId: 'question-1',
  selectedOption: 'B',
  isMarkedForReview: true,
  timeSpentSeconds: 12,
};

const testFixture = {
  id: 'test-1',
  title: 'Practice test',
  durationMinutes: 45,
  totalMarks: 20,
} as Awaited<ReturnType<typeof catalogApi.getTestById>>;

describe('Student mock-test service workflow contracts', () => {
  beforeEach(() => {
    m.rpc.mockReset();
    m.from.mockReset();
    m.queryLog = [];
    m.result = { data: null, error: null };
    vi.spyOn(catalogApi, 'getTestById').mockResolvedValue(testFixture);

    m.from.mockImplementation((table: string) => {
      const query: any = {
        select: (columns: string) => {
          m.queryLog.push(['select', table, columns]);
          return query;
        },
        eq: (column: string, value: string) => {
          m.queryLog.push(['eq', table, column, value]);
          return query;
        },
        maybeSingle: async () => m.result,
      };
      return query;
    });
  });

  it('loads the sanitized question set for the requested test', async () => {
    const questions: StudentTestQuestion[] = [
      {
        id: 'question-1',
        questionOrder: 1,
        questionText: 'Which option is correct?',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        marks: 2,
        negativeMarks: 0.5,
      },
    ];
    m.rpc.mockResolvedValue({ data: questions, error: null });

    await expect(catalogApi.getStudentTestQuestions('test-1')).resolves.toEqual(questions);
    expect(m.rpc).toHaveBeenCalledWith('get_student_exam_questions', { p_test_id: 'test-1' });
  });

  it('starts an attempt only from the confirmed server attempt and duration', async () => {
    m.rpc.mockResolvedValue({
      data: { attempt_id: 'attempt-1', start_time: '2026-10-15T10:00:00.000Z', duration_minutes: 30 },
      error: null,
    });

    await expect(catalogApi.startTestAttempt('test-1')).resolves.toEqual({
      attemptId: 'attempt-1',
      startTime: '2026-10-15T10:00:00.000Z',
      durationMinutes: 30,
    });
    expect(m.rpc).toHaveBeenCalledWith('start_test_attempt', { p_test_id: 'test-1' });
  });

  it('persists the complete selected-answer state and elapsed time', async () => {
    m.rpc.mockResolvedValue({ data: true, error: null });

    await expect(catalogApi.saveAnswers('attempt-1', [answer], 23)).resolves.toBe(true);
    expect(m.rpc).toHaveBeenCalledWith('save_test_answers', {
      p_attempt_id: 'attempt-1',
      p_answers: [answer],
      p_time_spent_seconds: 23,
    });
  });

  it('maps authoritative submission metrics, rank, and answer payload', async () => {
    m.rpc.mockResolvedValue({
      data: {
        score: 7,
        total_marks: 10,
        percentage: 70,
        accuracy: 80,
        correct_count: 4,
        wrong_count: 1,
        skipped_count: 1,
        rank: 12,
        total_candidates: 80,
        percentile: 85.5,
        passed: true,
      },
      error: null,
    });

    await expect(catalogApi.submitTestAttempt('attempt-1', [answer], 23, 'test-1')).resolves.toEqual({
      attemptId: 'attempt-1',
      testId: 'test-1',
      testTitle: 'Practice test',
      score: 7,
      totalMarks: 10,
      percentage: 70,
      accuracy: 80,
      correctCount: 4,
      wrongCount: 1,
      skippedCount: 1,
      timeSpentSeconds: 23,
      rank: 12,
      totalCandidates: 80,
      percentile: 85.5,
      passed: true,
    });
    expect(m.rpc).toHaveBeenCalledWith('submit_test_attempt', {
      p_attempt_id: 'attempt-1',
      p_answers: [answer],
      p_time_spent_seconds: 23,
    });
  });

  it('loads a saved result with attempt details from the matching result row', async () => {
    m.result = {
      data: {
        test_id: 'test-1',
        score: '7',
        total_marks: '10',
        percentage: '70',
        accuracy: '80',
        rank: 12,
        total_candidates: 80,
        percentile: '85.5',
        passed: true,
        test_attempts: {
          correct_count: 4,
          wrong_count: 1,
          skipped_count: 1,
          time_spent_seconds: 23,
        },
        tests: { title: 'Practice test' },
      },
      error: null,
    };

    await expect(catalogApi.getAttemptResult('attempt-1')).resolves.toMatchObject({
      attemptId: 'attempt-1',
      testId: 'test-1',
      testTitle: 'Practice test',
      score: 7,
      totalMarks: 10,
      correctCount: 4,
      wrongCount: 1,
      skippedCount: 1,
      timeSpentSeconds: 23,
      rank: 12,
      totalCandidates: 80,
      percentile: 85.5,
      passed: true,
    });
    expect(m.from).toHaveBeenCalledWith('test_results');
    expect(m.queryLog).toContainEqual(['eq', 'test_results', 'attempt_id', 'attempt-1']);
  });

  it('returns the server ranking breakdown and surfaces ranking RPC failures', async () => {
    const rankings = {
      testSeries: { id: 'series-1', name: 'Series', score: 7, totalMarks: 10, rank: 12, participants: 80 },
      district: { name: 'Kolkata', rank: 3, participants: 15 },
      westBengal: { rank: 12, participants: 80 },
    };
    m.rpc.mockResolvedValueOnce({ data: rankings, error: null });
    await expect(catalogApi.getAttemptRankings('attempt-1')).resolves.toEqual(rankings);
    expect(m.rpc).toHaveBeenCalledWith('get_attempt_rankings', { p_attempt_id: 'attempt-1' });

    m.rpc.mockResolvedValueOnce({ data: null, error: { message: 'ranking unavailable' } });
    await expect(catalogApi.getAttemptRankings('attempt-1')).rejects.toThrow('ranking unavailable');
  });
});
