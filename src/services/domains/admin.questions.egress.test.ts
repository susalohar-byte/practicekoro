import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  calls: [] as { table: string; ops: [string, unknown[]][] }[],
  rows: [] as unknown[],
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {},
  supabaseRuntime: { from: mocks.from },
}));

import {
  getAdminQuestionTopicCounts,
  getAdminQuestionsForTestContext,
  getAdminQuestionsPaged,
  getAdminQuestionsByIds,
} from './admin.questions';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.calls = [];
  mocks.rows = [];
  mocks.from.mockImplementation((table: string) => {
    const call = { table, ops: [] as [string, unknown[]][] };
    mocks.calls.push(call);
    const q: any = {};
    for (const k of ['select', 'order', 'eq', 'neq', 'in', 'not', 'or', 'range']) {
      q[k] = vi.fn((...args: unknown[]) => {
        call.ops.push([k, args]);
        return q;
      });
    }
    q.then = (resolve: any) => {
      const range = call.ops.find(([k]) => k === 'range');
      const offset = range ? Number(range[1][0]) : 0;
      const data = offset >= 1000 ? [] : mocks.rows;
      return Promise.resolve({ data, error: null, count: mocks.rows.length }).then(resolve);
    };
    return q;
  });
});

const args = (name: string, i = 0) =>
  mocks.calls[i].ops.filter(([k]) => k === name).map(([, a]) => a);

describe('question reads without full-table downloads', () => {
  it('counts questions per topic from the two id columns only', async () => {
    mocks.rows = [
      { id: '1', topic_id: 'ch1', chapter_id: 'ch1' },
      { id: '2', topic_id: 'ch1', chapter_id: 'ch1' },
      { id: '3', topic_id: null, chapter_id: 'ch2' },
      { id: '4', topic_id: null, chapter_id: null },
    ];
    expect(await getAdminQuestionTopicCounts()).toEqual({
      total: 4,
      byTopic: { ch1: 2, ch2: 1 },
    });
    expect(args('select')[0]).toEqual(['id, topic_id, chapter_id']);
    expect(args('eq')[0]).toEqual(['is_live_only', false]);
  });

  it('narrows the test-question picker to the topic of a topic test', async () => {
    await getAdminQuestionsForTestContext({ testType: 'topic', chapterId: 'ch1' });
    expect(args('or')).toEqual([['chapter_id.eq.ch1,topic_id.eq.ch1']]);
    expect(args('eq')[0]).toEqual(['is_live_only', false]);
    const [columns] = args('select')[0] as [string];
    expect(columns).not.toMatch(/(^|[\s,])\*/);
  });

  it('keeps unlabelled and matching rows for PYQ / full mock tests (superset of the UI rule)', async () => {
    await getAdminQuestionsForTestContext({
      testType: 'pyq',
      year: 2024,
      examId: 'e1',
      examTitle: 'WBP',
    });
    expect(args('or')).toEqual([
      ['source_year.is.null,source_year.eq.0,source_year.eq.2024'],
      ['source_exam.is.null,source_exam.eq."",source_exam.ilike."%WBP%"'],
    ]);

    mocks.calls = [];
    await getAdminQuestionsForTestContext({ testType: 'full_mock', examId: 'e1' });
    expect(args('or')).toEqual([]);
  });

  it('pages with every list filter, including difficulty', async () => {
    mocks.rows = [{ id: 'q1', question_text: 'Q' }];
    const res = await getAdminQuestionsPaged({ subjectId: 's1', difficulty: 'hard' }, 2, 100);
    expect(res.total).toBe(1);
    expect(args('eq')).toEqual(
      expect.arrayContaining([
        ['subject_id', 's1'],
        ['difficulty', 'hard'],
      ])
    );
    expect(args('range')).toEqual([[100, 199]]);
  });

  it('reads selected questions by id in chunks', async () => {
    const ids = Array.from({ length: 160 }, (_, i) => `q${i}`);
    await getAdminQuestionsByIds(ids);
    expect(mocks.calls).toHaveLength(2);
    expect((args('in', 0)[0] as [string, string[]])[1]).toHaveLength(150);
    expect((args('in', 1)[0] as [string, string[]])[1]).toHaveLength(10);
  });
});
