import { act, renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockTest } from '@/types';

const mocks = vi.hoisted(() => ({
  api: {
    getAllAdminTests: vi.fn(),
    getExams: vi.fn(),
    getSubjects: vi.fn(),
    getAllAdminChapters: vi.fn(),
    deleteTest: vi.fn(),
    updateTest: vi.fn(),
  },
}));

vi.mock('@/services/api', () => ({ api: mocks.api }));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

import { useAdminTests } from './useAdminTests';

const test1 = {
  id: 't1',
  title: 'WBPSC Full Mock 01',
  status: 'published',
  isActive: true,
} as MockTest;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.api.getAllAdminTests.mockResolvedValue([test1]);
  mocks.api.getExams.mockResolvedValue([]);
  mocks.api.getSubjects.mockResolvedValue([]);
  mocks.api.getAllAdminChapters.mockResolvedValue([]);
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

async function setup() {
  const hook = renderHook(() => useAdminTests(), { wrapper });
  await waitFor(() => expect(hook.result.current.tests).toHaveLength(1));
  return hook;
}

describe('useAdminTests delete', () => {
  it('removes a test the database deleted', async () => {
    mocks.api.deleteTest.mockResolvedValue(true);
    const { result } = await setup();

    await act(() => result.current.handleDeleteTest('t1'));
    expect(result.current.tests).toHaveLength(0);
  });

  it('offers to archive a test that students attempted, and archives it on confirm', async () => {
    mocks.api.deleteTest.mockRejectedValue(
      new Error(
        'Cannot delete this test: test_attempts still uses it (student attempts, results or a Live Test). Archive it instead so that history is kept.'
      )
    );
    mocks.api.updateTest.mockResolvedValue({ ...test1, status: 'archived', isActive: false });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = await setup();

    await act(() => result.current.handleDeleteTest('t1'));
    expect(mocks.api.updateTest).toHaveBeenCalledWith('t1', { status: 'archived' });
    expect(result.current.tests[0]).toMatchObject({ status: 'archived', isActive: false });
  });

  it('keeps the test unchanged when the admin declines to archive', async () => {
    mocks.api.deleteTest.mockRejectedValue(new Error('Cannot delete this test: test_results ...'));
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = await setup();

    await act(() => result.current.handleDeleteTest('t1'));
    expect(mocks.api.updateTest).not.toHaveBeenCalled();
    expect(result.current.tests[0]).toMatchObject({ status: 'published' });
  });
});
