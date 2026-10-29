import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  calls: [] as { table: string; ops: [string, unknown[]][] }[],
  rows: {} as Record<string, unknown[]>,
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {},
  supabaseRuntime: { from: mocks.from, rpc: mocks.rpc },
}));

import {
  getActiveLiveTest,
  getLiveTestById,
  getLiveTests,
  isTestLockedForEditing,
  getLiveTestLeaderboard,
  getLiveTestLeaderboards,
} from './admin.liveTests';

const future = () => new Date(Date.now() + 3600_000).toISOString();
const liveRow = (over: Record<string, unknown> = {}) => ({
  id: 'lt1',
  test_id: 't1',
  start_at: future(),
  status: 'upcoming',
  is_published: true,
  tests: {
    id: 't1',
    title: 'Paper',
    duration_minutes: 60,
    is_active: true,
    status: 'published',
  },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.calls = [];
  mocks.rows = {};
  mocks.rpc.mockResolvedValue({ data: null, error: { message: 'missing' } });
  mocks.from.mockImplementation((table: string) => {
    const call = { table, ops: [] as [string, unknown[]][] };
    mocks.calls.push(call);
    const q: any = {};
    for (const k of ['select', 'order', 'eq', 'neq', 'in', 'gte', 'lte', 'limit']) {
      q[k] = vi.fn((...args: unknown[]) => {
        call.ops.push([k, args]);
        return q;
      });
    }
    q.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    q.then = (resolve: any) =>
      Promise.resolve({ data: mocks.rows[table] ?? [], error: null }).then(resolve);
    return q;
  });
});

const callsTo = (table: string) => mocks.calls.filter((c) => c.table === table);
const args = (call: { ops: [string, unknown[]][] }, name: string) =>
  call.ops.filter(([k]) => k === name).map(([, a]) => a);

describe('live test reads', () => {
  it('lists live tests with explicit columns (no `*`, no paper icon blob)', async () => {
    mocks.rows.live_tests = [liveRow()];
    const list = await getLiveTests();
    expect(list.map((lt) => lt.id)).toEqual(['lt1']);
    const [columns] = args(callsTo('live_tests')[0], 'select')[0] as [string];
    expect(columns).not.toMatch(/\*/);
    expect(columns).not.toContain('icon_url');
    expect(columns).toContain('tests(');
  });

  it('reads a single live test by id instead of the whole list', async () => {
    mocks.rows.live_tests = [liveRow()];
    expect((await getLiveTestById('lt1'))?.id).toBe('lt1');
    const call = callsTo('live_tests')[0];
    expect(args(call, 'eq')).toEqual([['id', 'lt1']]);
    expect(args(call, 'limit')).toEqual([[1]]);
  });

  it('checks the edit lock with only the events of that paper', async () => {
    mocks.rows.live_tests = [liveRow()];
    expect(await isTestLockedForEditing('t1')).toBe(true);
    expect(args(callsTo('live_tests')[0], 'eq')).toEqual([['test_id', 't1']]);

    mocks.rows.live_tests = [];
    expect(await isTestLockedForEditing('t2')).toBe(false);
  });

  it('asks only for published, non-cancelled events when picking the active one', async () => {
    mocks.rows.live_tests = [liveRow()];
    expect((await getActiveLiveTest())?.id).toBe('lt1');
    const call = callsTo('live_tests')[0];
    expect(args(call, 'eq')).toEqual([['is_published', true]]);
    expect(args(call, 'neq')).toEqual([['status', 'cancelled']]);
  });
});

describe('live test leaderboards', () => {
  it('reuses a known live test and participations instead of reading them again', async () => {
    const [lt] = await getLiveTests();
    mocks.calls = [];
    await getLiveTestLeaderboard('lt1', { participations: [], liveTest: lt ?? null });
    expect(callsTo('app_settings')).toHaveLength(0);
    expect(callsTo('live_tests')).toHaveLength(0);
  });

  it('reads the participations row once for many live tests', async () => {
    mocks.rows.live_tests = [liveRow(), liveRow({ id: 'lt2', test_id: 't2' })];
    const liveTests = await getLiveTests();
    mocks.calls = [];
    const boards = await getLiveTestLeaderboards(liveTests);
    expect(Object.keys(boards)).toEqual(['lt1', 'lt2']);
    expect(callsTo('app_settings')).toHaveLength(1);
    expect(callsTo('live_tests')).toHaveLength(0);
  });
});
