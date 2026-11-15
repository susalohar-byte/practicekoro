import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ tables: {} as Record<string, unknown[]> }));

// Minimal PostgREST query builder: select/order are chainable, range resolves one page.
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    from: (table: string) => {
      const q = {
        select: () => q,
        order: () => q,
        range: async (from: number, to: number) => {
          const rows = m.tables[table] || [];
          return { data: rows.slice(from, to + 1), error: null, count: rows.length };
        },
      };
      return q;
    },
  },
}));

import { getExamContentCounts } from './admin.exams';
import { invalidateApiCache } from '@/services/apiCache';

beforeEach(() => invalidateApiCache());

describe('getExamContentCounts', () => {
  it('counts each test once per exam it belongs to, topic tests by mapped topics', async () => {
    m.tables = {
      exams: [{ id: 'wbp' }, { id: 'wbpsc' }, { id: 'tet' }],
      tests: [
        { id: 'fm1', exam_id: 'wbpsc', test_type: 'full_mock', chapter_id: null },
        { id: 'fm2', exam_id: null, test_type: 'full_mock', chapter_id: null },
        { id: 'pyq1', exam_id: 'wbp', test_type: 'pyq', chapter_id: null },
        { id: 'tp1', exam_id: null, test_type: 'topic', chapter_id: 'modern' },
        { id: 'tp2', exam_id: null, test_type: 'topic', chapter_id: 'ancient' },
        { id: 'tp3', exam_id: 'wbp', test_type: 'topic', chapter_id: 'modern' },
      ],
      // fm1 also belongs to WBP; fm2 only through the junction
      test_exams: [
        { test_id: 'fm1', exam_id: 'wbp' },
        { test_id: 'fm2', exam_id: 'wbp' },
      ],
      exam_topics: [
        { exam_id: 'wbp', topic_id: 'modern' },
        { exam_id: 'wbpsc', topic_id: 'ancient' },
      ],
    };

    expect(await getExamContentCounts()).toEqual({
      // tp3 is linked twice (main exam + topic) but counted once
      wbp: { fullMock: 2, pyq: 1, topic: 2 },
      wbpsc: { fullMock: 1, pyq: 0, topic: 1 },
      // No mapped topics: no longer shows every topic test on the platform
      tet: { fullMock: 0, pyq: 0, topic: 0 },
    });
  });
});
