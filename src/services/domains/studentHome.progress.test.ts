import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  error: false,
  calls: [] as unknown[][],
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    from: (table: string) => {
      m.calls.push(['from', table]);
      const q = {
        select: (columns: string) => {
          m.calls.push(['select', columns]);
          return q;
        },
        in: (column: string, ids: string[]) => {
          m.calls.push(['in', column, ids]);
          return q;
        },
        eq: (column: string, value: string) => {
          m.calls.push(['eq', column, value]);
          return q;
        },
        order: () => q,
        range: async () => ({
          data: m.rows,
          count: m.rows.length,
          error: m.error ? { message: 'denied' } : null,
        }),
      };
      return q;
    },
  },
}));
import { getHomepageAttemptProgress } from './studentHome';
beforeEach(() => {
  m.rows = [];
  m.error = false;
  m.calls = [];
});
describe('Caller-owned homepage progress', () => {
  it('uses explicit ownership joins and never selects correctness or answer keys', async () => {
    m.rows = [
      { attempt_id: 'a', question_id: 'q', selected_option: 'A' },
      { attempt_id: 'a', question_id: 'q', selected_option: 'B' },
      { attempt_id: 'a', question_id: 'skip', selected_option: null },
      { attempt_id: 'foreign', question_id: 'q', selected_option: 'A' },
    ];
    expect(await getHomepageAttemptProgress('student', ['a', 'a', 'b'])).toEqual({ a: 1, b: 0 });
    expect(m.calls).toContainEqual(['eq', 'test_attempts.user_id', 'student']);
    expect(m.calls).toContainEqual(['in', 'attempt_id', ['a', 'b']]);
    expect(m.calls.find((x) => x[0] === 'select')?.[1]).toBe(
      'attempt_id, question_id, selected_option, test_attempts!inner(user_id)'
    );
  });
  it('fails visibly instead of converting denied reads into zero progress', async () => {
    m.error = true;
    await expect(getHomepageAttemptProgress('student', ['a'])).rejects.toThrow('denied');
  });
  it('does not query without an authenticated identity and attempt IDs', async () => {
    expect(await getHomepageAttemptProgress('', ['a'])).toEqual({});
    expect(await getHomepageAttemptProgress('student', [])).toEqual({});
    expect(m.calls).toEqual([]);
  });
});
