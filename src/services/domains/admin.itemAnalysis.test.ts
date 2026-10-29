import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  rows: [] as any[],
  error: null as string | null,
  calls: [] as { fn: string; args: any }[],
  fromCalls: [] as string[],
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    rpc: async (fn: string, args: any) => {
      m.calls.push({ fn, args });
      return m.error ? { data: null, error: { message: m.error } } : { data: m.rows, error: null };
    },
    from: (table: string) => {
      m.fromCalls.push(table);
      throw new Error(`unexpected table read: ${table}`);
    },
  },
}));
import { getItemAnalysis } from './admin.settings';
const directSubject = {
  id: 's1',
  name: 'General Knowledge',
  exams: { id: 'e1', title: 'Real Exam' },
};
const question = () => ({
  id: 'q1',
  question_text: 'Real question',
  subject_id: 's1',
  chapter_id: 'c1',
  subjects: structuredClone(directSubject),
  chapters: { id: 'c1', name: 'Actual Chapter', subjects: structuredClone(directSubject) },
  difficulty: 'medium',
  correct_option: 'A',
  option_a: 'A',
  option_b: 'B',
});
/** One correct (A), one wrong (B), one skipped answer, 20s each: the server-side aggregate. */
const row = (overrides: Record<string, any> = {}) => ({
  question_id: 'q1',
  total: 3,
  correct: 1,
  wrong: 1,
  skipped: 1,
  total_time: 60,
  timed_count: 3,
  option_counts: { A: 1, B: 1, C: 0, D: 0 },
  question: question(),
  ...overrides,
});
beforeEach(() => {
  m.rows = [row()];
  m.error = null;
  m.calls = [];
  m.fromCalls = [];
});
describe('Admin item analysis (admin_item_analysis RPC)', () => {
  it('asks the database for per-question aggregates instead of reading every answer row', async () => {
    await getItemAnalysis();
    expect(m.calls).toEqual([{ fn: 'admin_item_analysis', args: { p_start: null, p_end: null } }]);
    expect(m.fromCalls).toEqual([]);
  });
  it('retains real question, chapter and exam labels and the aggregate counts', async () => {
    const [r] = await getItemAnalysis();
    expect(r).toMatchObject({
      questionId: 'q1',
      chapterId: 'c1',
      chapterName: 'Actual Chapter',
      examId: 'e1',
      examTitle: 'Real Exam',
      subjectId: 's1',
      subjectName: 'General Knowledge',
      totalAttempts: 3,
      correctCount: 1,
      wrongCount: 1,
      skippedCount: 1,
      // Skipped answers are excluded from accuracy (1 correct of 2 answered).
      accuracyRate: 50,
      failureRate: 50,
      avgTimeSpentSeconds: 20,
      optionDistribution: { A: 50, B: 50, C: 0, D: 0 },
      correctOption: 'A',
    });
  });
  it('keeps the server order (first answer per question)', async () => {
    m.rows = [
      row({ question_id: 'q2', question: { ...question(), id: 'q2' } }),
      row({ question_id: 'q1' }),
    ];
    expect((await getItemAnalysis()).map((i) => i.questionId)).toEqual(['q2', 'q1']);
  });
  it('filters by the actual exam derived through the subject hierarchy', async () => {
    expect(await getItemAnalysis({ examId: 'e1' })).toHaveLength(1);
    expect(await getItemAnalysis({ examId: 'unrelated' })).toHaveLength(0);
  });
  it('falls back to the chapter parent when the question has no subject assignment', async () => {
    m.rows[0].question.subjects = null;
    m.rows[0].question.subject_id = null;
    const [r] = await getItemAnalysis();
    expect(r).toMatchObject({
      subjectId: 's1',
      subjectName: 'General Knowledge',
      examId: 'e1',
      examTitle: 'Real Exam',
    });
  });
  it('keeps unassigned questions without fabricating an exam', async () => {
    m.rows[0].question.subjects = null;
    m.rows[0].question.chapters = null;
    const [r] = await getItemAnalysis();
    expect(r.questionId).toBe('q1');
    expect(r.examId).toBeUndefined();
    expect(r.examTitle).toBeUndefined();
  });
  it('reports no timing data as 0 instead of averaging untimed answers', async () => {
    m.rows = [row({ total_time: 0, timed_count: 0 })];
    const [r] = await getItemAnalysis();
    expect(r.avgTimeSpentSeconds).toBe(0);
    expect(r.isTimeTrap).toBe(false);
  });
  it('flags high-failure questions and time traps from the aggregates', async () => {
    m.rows = [row({ correct: 0, wrong: 5, skipped: 0, total: 5, total_time: 500, timed_count: 5 })];
    const [r] = await getItemAnalysis({ preset: 'high_failure' });
    expect(r).toMatchObject({
      failureRate: 100,
      isHighFailure: true,
      avgTimeSpentSeconds: 100,
      isTimeTrap: true,
    });
  });
  it('passes exact reporting bounds and distinguishes an empty range from failed reads', async () => {
    m.rows = [];
    expect(
      await getItemAnalysis({ startIso: '2026-10-08T00:00:00Z', endIso: '2026-10-08T23:59:59Z' })
    ).toEqual([]);
    expect(m.calls[0].args).toEqual({
      p_start: '2026-10-08T00:00:00Z',
      p_end: '2026-10-08T23:59:59Z',
    });
    m.error = 'Insufficient active staff permissions';
    await expect(getItemAnalysis()).rejects.toThrow('Insufficient active staff permissions');
  });
  it('rejects an unconfirmed response instead of showing an empty page', async () => {
    m.rows = null as any;
    await expect(getItemAnalysis()).rejects.toThrow('not confirmed');
  });
});
