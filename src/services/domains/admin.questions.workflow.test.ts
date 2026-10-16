import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  queryLog: [] as unknown[][],
  inserted: null as Record<string, unknown> | null,
  updated: null as Record<string, unknown> | null,
  row: null as Record<string, unknown> | null,
  rows: [] as Array<Record<string, unknown>>,
  error: null as { message: string } | null,
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { rpc: m.rpc, from: m.from },
}));

import { adminQuestionsApi } from './admin.questions';
import { adminTestQuestionsApi } from './admin.testQuestions';

const questionInput = {
  questionText: 'Question text',
  questionBengaliText: 'প্রশ্ন',
  subjectId: 'subject-1',
  chapterId: 'chapter-1',
  optionA: 'A',
  optionB: 'B',
  optionC: 'C',
  optionD: 'D',
  correctOption: 'C' as const,
  explanation: 'Because C is correct',
  difficulty: 'medium',
  defaultMarks: 2,
  defaultNegativeMarks: 0,
  sourceType: 'pyq' as const,
  isActive: true,
  status: 'published' as const,
};

const savedQuestion = {
  id: 'question-1',
  question_text: 'Question text',
  question_bengali_text: 'প্রশ্ন',
  subject_id: 'subject-1',
  chapter_id: 'chapter-1',
  topic_id: 'chapter-1',
  option_a: 'A',
  option_b: 'B',
  option_c: 'C',
  option_d: 'D',
  correct_option: 'C',
  explanation: 'Because C is correct',
  difficulty: 'medium',
  default_marks: 2,
  default_negative_marks: 0,
  source_type: 'pyq',
  is_active: true,
  status: 'active',
  tags: [],
};

describe('Admin question management persistence contracts', () => {
  beforeEach(() => {
    m.rpc.mockReset();
    m.from.mockReset();
    m.queryLog = [];
    m.inserted = null;
    m.updated = null;
    m.row = savedQuestion;
    m.rows = [{ id: 'question-1' }, { id: 'question-2' }];
    m.error = null;

    m.from.mockImplementation((table: string) => {
      const query: any = {
        insert: (payload: Record<string, unknown>) => {
          m.inserted = payload;
          m.queryLog.push(['insert', table]);
          return query;
        },
        update: (payload: Record<string, unknown>) => {
          m.updated = payload;
          m.queryLog.push(['update', table]);
          return query;
        },
        eq: (column: string, value: string) => {
          m.queryLog.push(['eq', table, column, value]);
          return query;
        },
        in: (column: string, values: string[]) => {
          m.queryLog.push(['in', table, column, values]);
          return query;
        },
        select: (columns: string) => {
          m.queryLog.push(['select', table, columns]);
          return query;
        },
        single: async () => ({
          data: m.inserted ? { ...m.row, id: m.inserted.id } : m.row,
          error: m.error,
        }),
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve({ data: m.rows, error: m.error }).then(resolve, reject),
      };
      return query;
    });
  });

  it('creates a question with database fields and returns the saved row', async () => {
    const created = await adminQuestionsApi.createQuestion(questionInput);
    expect(created).toMatchObject({
      questionText: 'Question text',
      correctOption: 'C',
      subjectId: 'subject-1',
      chapterId: 'chapter-1',
      status: 'active',
    });
    expect(created.id).toBe(m.inserted?.id);
    expect(m.from).toHaveBeenCalledWith('questions');
    expect(m.inserted).toMatchObject({
      chapter_id: 'chapter-1',
      topic_id: 'chapter-1',
      subject_id: 'subject-1',
      correct_option: 'C',
      default_marks: 2,
      status: 'active',
    });
  });

  it('updates only supplied question fields by the requested question ID', async () => {
    m.row = { ...savedQuestion, question_text: 'Updated wording', correct_option: 'D' };

    await expect(
      adminQuestionsApi.updateQuestion('question-1', {
        questionText: 'Updated wording',
        correctOption: 'D',
      })
    ).resolves.toMatchObject({ questionText: 'Updated wording', correctOption: 'D' });
    expect(m.updated).toEqual({ question_text: 'Updated wording', correct_option: 'D' });
    expect(m.queryLog).toContainEqual(['eq', 'questions', 'id', 'question-1']);
  });

  it('reports bulk status changes only for returned question rows', async () => {
    await expect(adminQuestionsApi.updateQuestionsStatus(['question-1', 'question-2'], 'archived'))
      .resolves.toEqual({ success: true, updatedCount: 2 });
    expect(m.updated).toEqual({ status: 'archived', is_active: false });
    expect(m.queryLog).toContainEqual([
      'in',
      'questions',
      'id',
      ['question-1', 'question-2'],
    ]);
  });

  it('persists an ordered question paper through the confirmed atomic RPC', async () => {
    m.rpc.mockResolvedValue({
      data: { success: true, test_id: 'test-1', total_questions: 2 },
      error: null,
    });
    const assignments = [
      { questionId: 'question-1', orderIndex: 1, marks: 2, negativeMarks: 0.5 },
      { questionId: 'question-2', orderIndex: 2, marks: 1 },
    ];

    await expect(adminTestQuestionsApi.saveTestQuestions('test-1', assignments)).resolves.toEqual({
      success: true,
    });
    expect(m.rpc).toHaveBeenCalledWith('save_test_questions', {
      p_test_id: 'test-1',
      p_questions: [
        { question_id: 'question-1', question_order: 1, marks: 2, negative_marks: 0.5 },
        { question_id: 'question-2', question_order: 2, marks: 1, negative_marks: 0 },
      ],
    });
  });

  it('does not acknowledge an unconfirmed question-paper assignment', async () => {
    m.rpc.mockResolvedValue({ data: { success: true, test_id: 'another-test', total_questions: 1 }, error: null });

    await expect(
      adminTestQuestionsApi.saveTestQuestions('test-1', [
        { questionId: 'question-1', orderIndex: 1 },
      ])
    ).resolves.toMatchObject({ success: false });
  });
});
