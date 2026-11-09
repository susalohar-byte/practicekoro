import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ updates: [] as { id: string; order_index: number }[] }));

vi.mock('@/lib/supabase', () => {
  const from = () => {
    let payload: { order_index: number } = { order_index: 0 };
    const chain = {
      update(p: { order_index: number }) {
        payload = p;
        return chain;
      },
      eq(_col: string, id: string) {
        mocks.updates.push({ id, order_index: payload.order_index });
        return chain;
      },
      select() {
        return chain;
      },
      maybeSingle() {
        const last = mocks.updates[mocks.updates.length - 1];
        return Promise.resolve({ data: { id: last.id }, error: null });
      },
    };
    return chain;
  };
  return { isSupabaseConfigured: true, supabaseRuntime: { from } };
});

import { reorderExams } from './admin.exams';

beforeEach(() => {
  mocks.updates = [];
});

describe('reorderExams', () => {
  it('writes order_index 1..n, only for exams whose position changed', async () => {
    // Old order: a=1, b=2, c=3, d=4. New order: a, c, b, d (b and c swapped)
    await reorderExams(['a', 'c', 'b', 'd'], { a: 1, b: 2, c: 3, d: 4 });
    expect(mocks.updates).toEqual([
      { id: 'c', order_index: 2 },
      { id: 'b', order_index: 3 },
    ]);
  });

  it('numbers every exam when the old order is unknown', async () => {
    await reorderExams(['x', 'y']);
    expect(mocks.updates).toEqual([
      { id: 'x', order_index: 1 },
      { id: 'y', order_index: 2 },
    ]);
  });
});
