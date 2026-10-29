import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  calls: [] as { table: string; ops: [string, unknown[]][] }[],
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {},
  supabaseRuntime: { from: mocks.from, rpc: mocks.rpc },
}));

import { analyticsApi } from './analytics';

/** Count the fake database "returns" for each table + filter combination. */
const COUNTS: Record<string, number> = {
  exams: 4,
  subjects: 9,
  chapters: 30,
  test_series: 3,
  tests: 12,
  'tests|eq:status=published': 8,
  'tests|eq:status=draft': 3,
  'tests|eq:status=archived': 1,
  questions: 500,
  'questions|eq:is_active=true|or:status.is.null,status.neq.archived': 450,
  test_attempts: 2000,
  'test_attempts|eq:status=completed': 1500,
  'profiles|eq:role=student': 120,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.calls = [];
  mocks.rpc.mockResolvedValue({ data: null, error: { message: 'rpc missing' } });
  mocks.from.mockImplementation((table: string) => {
    const call = { table, ops: [] as [string, unknown[]][] };
    mocks.calls.push(call);
    const q: any = {};
    for (const k of ['select', 'eq', 'or']) {
      q[k] = vi.fn((...args: unknown[]) => {
        call.ops.push([k, args]);
        return q;
      });
    }
    q.then = (resolve: any) => {
      const key = [
        table,
        ...call.ops
          .filter(([k]) => k !== 'select')
          .map(([k, a]) => (k === 'eq' ? `eq:${a[0]}=${a[1]}` : `${k}:${a[0]}`)),
      ].join('|');
      return Promise.resolve({ data: null, error: null, count: COUNTS[key] ?? -1 }).then(resolve);
    };
    return q;
  });
});

describe('admin dashboard counts fallback', () => {
  it('counts with head-only requests instead of downloading rows', async () => {
    const stats = await analyticsApi.getAdminDashboardStats();
    expect(stats).toEqual({
      totalExams: 4,
      activeExams: 4,
      totalSubjects: 9,
      totalChapters: 30,
      totalTestSeries: 3,
      totalTests: 12,
      publishedTests: 8,
      draftTests: 3,
      archivedTests: 1,
      totalQuestions: 500,
      activeQuestions: 450,
      totalAttempts: 2000,
      completedAttempts: 1500,
      totalStudents: 120,
    });
    expect(mocks.calls.length).toBe(13);
    for (const call of mocks.calls) {
      const select = call.ops.find(([k]) => k === 'select');
      expect(select?.[1]).toEqual(['id', { count: 'exact', head: true }]);
    }
  });

  it('uses the aggregate RPC when it is available', async () => {
    mocks.rpc.mockResolvedValue({ data: { total_tests: 5, total_questions: 7 }, error: null });
    const stats = await analyticsApi.getAdminDashboardStats();
    expect(stats.totalTests).toBe(5);
    expect(stats.totalQuestions).toBe(7);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
