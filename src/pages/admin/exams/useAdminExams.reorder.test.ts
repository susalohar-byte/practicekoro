import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  api: {
    getAllAdminExams: vi.fn(),
    getAllAdminTests: vi.fn(),
    getSubjects: vi.fn(),
    getExamMappingCounts: vi.fn(),
    getExamCategories: vi.fn(),
    reorderExams: vi.fn(),
  },
}));

vi.mock('@/services/api', () => ({ api: mocks.api }));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }));

import { useAdminExams } from './useAdminExams';

const exam = (id: string, orderIndex: number) => ({
  id,
  title: id.toUpperCase(),
  slug: id,
  category: 'State Govt',
  isActive: true,
  orderIndex,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.api.getAllAdminExams.mockResolvedValue([exam('a', 1), exam('b', 2), exam('c', 3)]);
  mocks.api.getAllAdminTests.mockResolvedValue([]);
  mocks.api.getSubjects.mockResolvedValue([]);
  mocks.api.getExamMappingCounts.mockResolvedValue({});
  mocks.api.getExamCategories.mockResolvedValue([]);
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

async function setup() {
  const hook = renderHook(() => useAdminExams());
  await waitFor(() => expect(hook.result.current.exams).toHaveLength(3));
  return hook;
}

describe('useAdminExams drag-to-reorder', () => {
  it('moves the dragged exam to the drop position and saves the new order', async () => {
    mocks.api.reorderExams.mockResolvedValue(undefined);
    const { result } = await setup();

    await act(() => result.current.reorderExam('c', 'a'));
    expect(result.current.exams.map((e) => `${e.id}${e.orderIndex}`)).toEqual(['c1', 'a2', 'b3']);
    expect(mocks.api.reorderExams).toHaveBeenCalledWith(['c', 'a', 'b'], { a: 1, b: 2, c: 3 });
  });

  it('puts the old order back when saving fails', async () => {
    mocks.api.reorderExams.mockRejectedValue(new Error('network down'));
    const { result } = await setup();

    await act(() => result.current.reorderExam('a', 'c'));
    expect(result.current.exams.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('network down'));
  });

  it('does nothing when an exam is dropped on itself', async () => {
    const { result } = await setup();
    await act(() => result.current.reorderExam('b', 'b'));
    expect(mocks.api.reorderExams).not.toHaveBeenCalled();
  });
});
