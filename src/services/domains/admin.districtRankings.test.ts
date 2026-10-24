import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  data: {} as Record<string, any[]>,
  rpc: { data: null as any, error: null as any },
  maxRows: 1000,
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    rpc: async () => m.rpc,
    from: (table: string) => {
      const filters: ((r: any) => boolean)[] = [];
      let lo = 0,
        hi = Infinity;
      const q: any = {
        select: () => q,
        order: () => q,
        range: (a: number, b: number) => {
          lo = a;
          hi = b;
          return q;
        },
        eq: (k: string, v: any) => {
          filters.push((r) => r[k] === v);
          return q;
        },
        in: (k: string, v: any[]) => {
          filters.push((r) => v.includes(r[k]));
          return q;
        },
        gte: () => q,
        lte: () => q,
        then: (yes: any, no: any) => {
          const all = (m.data[table] || []).filter((r) => filters.every((f) => f(r)));
          // The server caps every response at max_rows regardless of the requested range.
          const end = Math.min(hi + 1, lo + m.maxRows);
          return Promise.resolve({ data: all.slice(lo, end), count: all.length, error: null }).then(
            yes,
            no
          );
        },
      };
      return q;
    },
  },
}));
import { getAdminDistrictRankings } from './admin.analytics';

describe('getAdminDistrictRankings fallback', () => {
  beforeEach(() => {
    m.maxRows = 300;
    m.rpc = { data: null, error: { code: 'PGRST202', message: 'Could not find the function' } };
    const attempts = Array.from({ length: 1200 }, (_, i) => ({
      id: `a${String(i).padStart(5, '0')}`,
      user_id: `u${i % 400}`,
      test_id: 't1',
      score: 50,
      total_marks: 100,
      status: 'completed',
    }));
    const profiles = Array.from({ length: 400 }, (_, i) => ({
      id: `u${i}`,
      full_name: `Student ${i}`,
      district: i % 2 ? 'Kolkata' : 'Howrah',
      role: 'student',
    }));
    m.data = { test_attempts: attempts, profiles, tests: [] };
  });

  it('counts every attempt and student instead of the first server page', async () => {
    const rows = await getAdminDistrictRankings();
    expect(rows.reduce((n, r) => n + r.attemptsCount, 0)).toBe(1200);
    expect(rows.reduce((n, r) => n + r.studentCount, 0)).toBe(400);
  });

  it('surfaces RPC errors other than a missing function instead of falling back', async () => {
    m.rpc = { data: null, error: { code: '42501', message: 'permission denied' } };
    await expect(getAdminDistrictRankings()).rejects.toThrow('permission denied');
  });
});
