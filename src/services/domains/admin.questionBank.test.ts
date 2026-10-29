import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  calls: [] as { table: string; ops: [string, unknown[]][] }[],
  result: { data: [] as unknown[], error: null as unknown, count: 0 as number | null },
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { from: mocks.from },
}));

import {
  getQuestionBankIds,
  getQuestionBankPage,
  getQuestionBankStats,
  matchesQuestionBankQuery,
  questionBankQueryIsEmpty,
  type QuestionBankQuery,
} from './admin.questionBank';
import type { Question } from '@/types';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.calls = [];
  mocks.result = { data: [], error: null, count: 0 };
  mocks.from.mockImplementation((table: string) => {
    const call = { table, ops: [] as [string, unknown[]][] };
    mocks.calls.push(call);
    const q: any = {};
    for (const k of ['select', 'order', 'eq', 'neq', 'in', 'not', 'or', 'ilike', 'range']) {
      q[k] = vi.fn((...args: unknown[]) => {
        call.ops.push([k, args]);
        return q;
      });
    }
    q.then = (resolve: any) => {
      const range = call.ops.find(([k]) => k === 'range');
      // Loader pages after the first (1000 rows each) are empty so paged loaders stop.
      const offset = range ? Number(range[1][0]) : 0;
      return Promise.resolve(
        offset >= 1000 ? { data: [], error: null, count: 0 } : mocks.result
      ).then(resolve);
    };
    return q;
  });
});

const ops = (i = 0) => mocks.calls[i].ops;
const opArgs = (name: string, i = 0) =>
  ops(i)
    .filter(([k]) => k === name)
    .map(([, a]) => a);

describe('question bank server query', () => {
  it('fetches one page with explicit columns, an exact count and stable ordering', async () => {
    mocks.result = {
      data: [{ id: 'q1', question_text: 'Q', option_a: 'a', option_b: 'b', status: 'active' }],
      error: null,
      count: 42,
    };
    const res = await getQuestionBankPage({ liveOnly: false }, 3, 10);
    expect(res.total).toBe(42);
    expect(res.questions.map((q) => q.id)).toEqual(['q1']);

    const [columns, options] = opArgs('select')[0] as [string, unknown];
    expect(columns).not.toMatch(/(^|[\s,])\*/);
    expect(columns).toContain('question_text');
    expect(options).toEqual({ count: 'exact' });
    expect(opArgs('eq')).toContainEqual(['is_live_only', false]);
    expect(opArgs('range')).toEqual([[20, 29]]);
    expect(opArgs('order')).toEqual([
      ['created_at', { ascending: false }],
      ['id', { ascending: false }],
    ]);
  });

  it('maps every filter onto the query', async () => {
    const query: QuestionBankQuery = {
      liveOnly: false,
      examMode: true,
      search: 'kolkata',
      searchSubjectIds: ['sub_geo'],
      searchChapterIds: [],
      sourceExam: 'WBP',
      subjectName: 'Geo',
      subjectIds: ['sub_geo'],
      topicName: 'Rivers',
      chapterIds: ['ch_rivers'],
      type: 'pyq',
      status: 'published',
      sourceYear: '2024',
      source: 'original',
    };
    await getQuestionBankPage(query, 1, 10);

    expect(opArgs('not')).toContainEqual(['source_exam', 'is', null]);
    expect(opArgs('ilike')).toContainEqual(['source_exam', '%WBP%']);
    expect(opArgs('in')).toContainEqual(['subject_id', ['sub_geo']]);
    expect(opArgs('in')).toContainEqual(['chapter_id', ['ch_rivers']]);
    expect(opArgs('eq')).toContainEqual(['source_type', 'pyq']);
    expect(opArgs('eq')).toContainEqual(['source_year', 2024]);
    const ors = opArgs('or').map((a) => a[0] as string);
    const searchOr = ors.find((o) => o.includes('question_text.ilike'));
    expect(searchOr).toContain('option_a.ilike."%kolkata%"');
    expect(searchOr).toContain('subject_id.in.("sub_geo")');
    expect(searchOr).not.toContain('chapter_id.in');
    expect(ors).toContain('status.is.null,status.eq."",status.eq.active');
    expect(ors).toContain('source_type.is.null,source_type.neq.pyq');
  });

  it('restricts the Live Test mode to the chosen paper and skips impossible queries', async () => {
    await getQuestionBankPage({ liveOnly: true, questionIds: ['a', 'b'] }, 1, 10);
    expect(opArgs('eq')).toContainEqual(['is_live_only', true]);
    expect(opArgs('in')).toContainEqual(['id', ['a', 'b']]);

    mocks.calls = [];
    expect(await getQuestionBankPage({ liveOnly: true, questionIds: [] }, 1, 10)).toEqual({
      questions: [],
      total: 0,
    });
    expect(await getQuestionBankIds({ liveOnly: false, subjectName: 'X', subjectIds: [] })).toEqual(
      []
    );
    expect(mocks.calls).toHaveLength(0);
  });

  it('selects only ids for "Select All"', async () => {
    mocks.result = { data: [{ id: 'q1' }, { id: 'q2' }], error: null, count: null };
    expect(await getQuestionBankIds({ liveOnly: false })).toEqual(['q1', 'q2']);
    expect(opArgs('select')[0]).toEqual(['id']);
  });

  it('computes the stat cards from head-only counts', async () => {
    mocks.result = { data: null as unknown as unknown[], error: null, count: 7 };
    const stats = await getQuestionBankStats();
    expect(stats).toEqual({
      total: 7,
      examQuestions: 7,
      subjectQuestions: 7,
      liveQuestions: 7,
      published: 7,
      draft: 7,
      underReview: 7,
    });
    expect(mocks.calls).toHaveLength(7);
    for (let i = 0; i < mocks.calls.length; i++) {
      expect(opArgs('select', i)[0]).toEqual(['id', { count: 'exact', head: true }]);
    }
  });

  it('throws instead of returning an empty page on a read error', async () => {
    mocks.result = { data: [], error: { message: 'denied' }, count: null };
    await expect(getQuestionBankPage({ liveOnly: false }, 1, 10)).rejects.toThrow('denied');
  });
});

describe('question bank in-browser filter (demo store)', () => {
  const q = (over: Partial<Question>): Question =>
    ({
      id: 'q',
      questionText: 'Capital of West Bengal?',
      optionA: 'Kolkata',
      optionB: 'Delhi',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      sourceType: 'topic',
      status: 'active',
      ...over,
    }) as Question;

  it('applies the same rules the old page filter used', () => {
    expect(matchesQuestionBankQuery(q({}), { liveOnly: false, search: 'kolkata' })).toBe(true);
    expect(matchesQuestionBankQuery(q({ isLiveOnly: true }), { liveOnly: false })).toBe(false);
    expect(matchesQuestionBankQuery(q({}), { liveOnly: false, examMode: true })).toBe(false);
    expect(
      matchesQuestionBankQuery(q({ sourceExam: 'WBP Constable' }), {
        liveOnly: false,
        examMode: true,
        sourceExam: 'wbp',
      })
    ).toBe(true);
    expect(matchesQuestionBankQuery(q({}), { liveOnly: false, status: 'published' })).toBe(true);
    expect(matchesQuestionBankQuery(q({}), { liveOnly: false, type: 'full mock' })).toBe(false);
    expect(matchesQuestionBankQuery(q({}), { liveOnly: false, source: 'original' })).toBe(true);
    expect(questionBankQueryIsEmpty({ liveOnly: false, source: 'reference' })).toBe(true);
  });
});
