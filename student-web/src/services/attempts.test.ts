import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callsTo, mockSupabase, queueTable, resetSupabaseMock } from '@/test/supabaseMock';

vi.mock('@/lib/supabase', async () => ({
  supabase: (await import('@/test/supabaseMock')).mockSupabase,
}));

import { AppError } from '@/lib/errors';
import {
  clearDraft,
  fetchAttempt,
  fetchAttemptHistory,
  fetchAttemptRankings,
  fetchInProgressAttempts,
  fetchQuestions,
  fetchSolutions,
  loadDraft,
  saveAnswers,
  saveDraft,
  startAttempt,
  submitAttempt,
} from './attempts';

beforeEach(() => {
  resetSupabaseMock();
  localStorage.clear();
});

const rpcOk = (data: unknown) => mockSupabase.rpc.mockResolvedValueOnce({ data, error: null });
const rpcErr = (error: unknown) => mockSupabase.rpc.mockResolvedValueOnce({ data: null, error });

describe('fetchQuestions', () => {
  it('calls get_student_exam_questions and maps each question', async () => {
    rpcOk([
      {
        id: 11,
        questionOrder: 4,
        questionText: 'Capital of India?',
        questionBengaliText: 'ভারতের রাজধানী?',
        optionA: 'Delhi',
        optionB: 'Kolkata',
        optionC: 'Mumbai',
        optionD: 'Chennai',
        marks: '2',
        negativeMarks: 0.5,
        imageUrl: 'https://img/q.png',
      },
      { id: 12, questionText: 'Same', questionBengaliText: ' Same ' },
    ]);
    const qs = await fetchQuestions('t1');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_student_exam_questions', {
      p_test_id: 't1',
    });
    expect(qs[0]).toEqual({
      id: '11',
      order: 4,
      textEnglish: 'Capital of India?',
      textBengali: 'ভারতের রাজধানী?',
      imageUrl: 'https://img/q.png',
      options: { A: 'Delhi', B: 'Kolkata', C: 'Mumbai', D: 'Chennai' },
      marks: 2,
      negativeMarks: 0.5,
    });
    // Bengali identical to English is dropped; defaults for order, marks and options.
    expect(qs[1]).toMatchObject({
      order: 2,
      textBengali: null,
      imageUrl: null,
      marks: 1,
      negativeMarks: 0,
      options: { A: '', B: '', C: '', D: '' },
    });
  });

  it('returns [] for null data and throws RPC errors', async () => {
    rpcOk(null);
    await expect(fetchQuestions('t')).resolves.toEqual([]);
    rpcErr({ code: '40300', message: 'Pro pass required' });
    await expect(fetchQuestions('t')).rejects.toMatchObject({ code: '40300' });
  });
});

describe('startAttempt', () => {
  it('returns the server attempt with its start time and duration', async () => {
    rpcOk({ attempt_id: 'a1', start_time: '2026-10-25T10:00:00Z', duration_minutes: '90' });
    const a = await startAttempt('t1');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('start_test_attempt', { p_test_id: 't1' });
    expect(a).toEqual({
      id: 'a1',
      testId: 't1',
      startedAt: new Date('2026-10-25T10:00:00Z'),
      durationMinutes: 90,
    });
  });

  it('rejects a response without an attempt id or a valid start time', async () => {
    rpcOk({ start_time: '2026-10-25T10:00:00Z' });
    await expect(startAttempt('t')).rejects.toBeInstanceOf(AppError);
    rpcOk({ attempt_id: 'a', start_time: 'garbage' });
    await expect(startAttempt('t')).rejects.toThrow('The test could not be started. Please retry.');
    rpcOk(null);
    await expect(startAttempt('t')).rejects.toBeInstanceOf(AppError);
  });

  it('passes the server error through', async () => {
    rpcErr({ code: '40100', message: 'Authentication required' });
    await expect(startAttempt('t')).rejects.toMatchObject({ code: '40100' });
  });
});

describe('saveAnswers / submitAttempt', () => {
  it('autosaves the answers payload with rounded, non-negative seconds', async () => {
    rpcOk(null);
    await saveAnswers('a1', { q1: 'B', q2: 'D' }, 12.6);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('save_test_answers', {
      p_attempt_id: 'a1',
      p_answers: [
        { questionId: 'q1', selectedOption: 'B' },
        { questionId: 'q2', selectedOption: 'D' },
      ],
      p_time_spent_seconds: 13,
    });
    rpcOk(null);
    await saveAnswers('a1', {}, -5);
    expect(mockSupabase.rpc).toHaveBeenLastCalledWith(
      'save_test_answers',
      expect.objectContaining({ p_answers: [], p_time_spent_seconds: 0 })
    );
  });

  it('swallows autosave failures', async () => {
    mockSupabase.rpc.mockRejectedValueOnce(new Error('offline'));
    await expect(saveAnswers('a1', { q: 'A' }, 1)).resolves.toBeUndefined();
  });

  it('submits every answer and accepts a graded response', async () => {
    rpcOk({ success: true, total_marks: 100 });
    await expect(submitAttempt('a1', { q1: 'C' }, 61.4)).resolves.toBeUndefined();
    expect(mockSupabase.rpc).toHaveBeenCalledWith('submit_test_attempt', {
      p_attempt_id: 'a1',
      p_answers: [{ questionId: 'q1', selectedOption: 'C' }],
      p_time_spent_seconds: 61,
    });
  });

  it('treats success=false or a missing total as a failed submit', async () => {
    rpcOk({ success: false, total_marks: 100 });
    await expect(submitAttempt('a', {}, 0)).rejects.toThrow(
      'Your test could not be submitted. Please retry.'
    );
    rpcOk({ success: true });
    await expect(submitAttempt('a', {}, 0)).rejects.toBeInstanceOf(AppError);
  });

  it('throws the RPC error on submit', async () => {
    rpcErr({ message: 'Failed to fetch' });
    await expect(submitAttempt('a', {}, 0)).rejects.toEqual({ message: 'Failed to fetch' });
  });
});

describe('attempt history', () => {
  const row = {
    id: 'a1',
    test_id: 't1',
    score: 10,
    total_marks: 20,
    correct_count: 12,
    wrong_count: 4,
    skipped_count: 4,
    time_spent_seconds: '600',
    end_time: '2026-10-25T11:00:00Z',
    created_at: '2026-10-25T10:00:00Z',
    tests: {
      title: 'Mock 1',
      exam_id: 'e1',
      test_type: 'chapter_mock',
      total_marks: 20,
      is_live_only: true,
    },
    test_results: [
      {
        score: 15,
        total_marks: 25,
        percentage: 60,
        accuracy: 75,
        rank: 3,
        total_candidates: 120,
        percentile: 97.5,
        passed: true,
      },
    ],
  };

  it('reads completed attempts newest first and prefers test_results values', async () => {
    queueTable('test_attempts', { data: [row] });
    const [a] = await fetchAttemptHistory('u1');
    expect(callsTo('test_attempts')[0].chain.slice(1)).toEqual([
      ['eq', 'user_id', 'u1'],
      ['eq', 'status', 'completed'],
      ['order', 'created_at', { ascending: false }],
      ['limit', 200],
    ]);
    expect(a).toEqual({
      id: 'a1',
      testId: 't1',
      testTitle: 'Mock 1',
      examId: 'e1',
      category: 'Topic Test',
      isLive: true,
      score: 15,
      totalMarks: 25,
      percentage: 60,
      accuracy: 75,
      correctCount: 12,
      wrongCount: 4,
      skippedCount: 4,
      timeSpentSeconds: 600,
      completedAt: new Date('2026-10-25T11:00:00Z'),
      rank: 3,
      totalCandidates: 120,
      percentile: 97.5,
      passed: true,
    });
  });

  it('derives percentage and accuracy when the result row is missing', async () => {
    queueTable('test_attempts', {
      data: [
        {
          id: 'a2',
          test_id: 't2',
          score: 5,
          total_marks: 0,
          correct_count: 3,
          wrong_count: 1,
          created_at: '2026-10-20T08:00:00Z',
          tests: [{ total_marks: 20 }],
          test_results: [],
        },
      ],
    });
    const [a] = await fetchAttemptHistory('u1');
    expect(a).toMatchObject({
      testTitle: 'Test',
      category: 'Full Test',
      score: 5,
      totalMarks: 20,
      percentage: 25,
      accuracy: 75,
      rank: null,
      passed: null,
      completedAt: new Date('2026-10-20T08:00:00Z'),
    });
  });

  it('reports zero percentage and accuracy when nothing was answered', async () => {
    queueTable('test_attempts', {
      data: [{ id: 'a3', test_id: 't', created_at: '2026-10-20T08:00:00Z' }],
    });
    const [a] = await fetchAttemptHistory('u1');
    expect(a).toMatchObject({ score: 0, totalMarks: 0, percentage: 0, accuracy: 0 });
  });

  it('throws on error and returns [] for no data', async () => {
    queueTable('test_attempts', { data: null }, { error: { message: 'x' } });
    await expect(fetchAttemptHistory('u')).resolves.toEqual([]);
    await expect(fetchAttemptHistory('u')).rejects.toEqual({ message: 'x' });
  });

  it('fetchAttempt reads one completed attempt or null', async () => {
    queueTable('test_attempts', { data: row }, { data: null });
    await expect(fetchAttempt('a1')).resolves.toMatchObject({ id: 'a1', score: 15 });
    expect(callsTo('test_attempts')[0].chain).toEqual(
      expect.arrayContaining([['eq', 'id', 'a1'], ['eq', 'status', 'completed'], ['maybeSingle']])
    );
    await expect(fetchAttempt('zz')).resolves.toBeNull();
  });

  it('lists in-progress attempts with their test duration', async () => {
    queueTable('test_attempts', {
      data: [
        {
          id: 'p1',
          test_id: 't1',
          start_time: '2026-10-25T10:00:00Z',
          tests: { title: 'Paper', duration_minutes: 45 },
        },
        { id: 'p2', test_id: 't2', start_time: '2026-10-25T09:00:00Z', tests: null },
      ],
    });
    const list = await fetchInProgressAttempts('u9');
    expect(list).toEqual([
      {
        id: 'p1',
        testId: 't1',
        testTitle: 'Paper',
        startedAt: new Date('2026-10-25T10:00:00Z'),
        durationMinutes: 45,
      },
      {
        id: 'p2',
        testId: 't2',
        testTitle: 'Test',
        startedAt: new Date('2026-10-25T09:00:00Z'),
        durationMinutes: 0,
      },
    ]);
    expect(callsTo('test_attempts')[0].chain).toContainEqual(['eq', 'status', 'in_progress']);
    expect(callsTo('test_attempts')[0].chain).toContainEqual(['limit', 10]);
  });
});

describe('rankings and solutions', () => {
  it('maps the three ranking scopes with defaults', async () => {
    rpcOk({
      testSeries: { id: 's1', name: 'Series', rank: '4', participants: 80 },
      district: { name: 'Hooghly', rank: 2, participants: '30' },
    });
    const r = await fetchAttemptRankings('a1');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_attempt_rankings', { p_attempt_id: 'a1' });
    expect(r).toEqual({
      testSeries: { id: 's1', name: 'Series', rank: 4, participants: 80 },
      district: { name: 'Hooghly', rank: 2, participants: 30 },
      westBengal: { rank: null, participants: 0 },
    });
  });

  it('throws ranking errors', async () => {
    rpcErr({ message: 'nope' });
    await expect(fetchAttemptRankings('a')).rejects.toEqual({ message: 'nope' });
  });

  it('maps solutions with normalized option letters and explanations', async () => {
    rpcOk([
      {
        id: 1,
        questionText: 'Q',
        optionA: 'a',
        selectedOption: ' b ',
        correctOption: 'c',
        isCorrect: false,
        marksAwarded: '-0.25',
        explanation: '  Because.  ',
        explanationBengali: '   ',
        isBookmarked: true,
      },
      { id: 2, questionText: 'Q2', selectedOption: 'E', correctOption: null, isCorrect: true },
    ]);
    const [s1, s2] = await fetchSolutions('a1');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_attempt_solutions', { p_attempt_id: 'a1' });
    expect(s1).toMatchObject({
      selected: 'B',
      correct: 'C',
      isCorrect: false,
      marksAwarded: -0.25,
      explanation: 'Because.',
      explanationBengali: null,
      isBookmarked: true,
    });
    expect(s2).toMatchObject({
      selected: null,
      correct: null,
      isCorrect: true,
      marksAwarded: 0,
      isBookmarked: false,
    });
  });
});

describe('local attempt draft', () => {
  it('round-trips a draft per attempt and clears it', () => {
    expect(loadDraft('a1')).toBeNull();
    saveDraft('a1', { answers: { q1: 'A' }, marked: ['q2'], index: 3 });
    expect(localStorage.getItem('pk-attempt-draft:a1')).not.toBeNull();
    expect(loadDraft('a1')).toEqual({ answers: { q1: 'A' }, marked: ['q2'], index: 3 });
    expect(loadDraft('a2')).toBeNull();
    clearDraft('a1');
    expect(loadDraft('a1')).toBeNull();
  });

  it('returns null for a corrupt draft', () => {
    localStorage.setItem('pk-attempt-draft:bad', '{not json');
    expect(loadDraft('bad')).toBeNull();
  });

  it('ignores storage failures when saving', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(() => saveDraft('a', { answers: {}, marked: [], index: 0 })).not.toThrow();
    spy.mockRestore();
  });
});
