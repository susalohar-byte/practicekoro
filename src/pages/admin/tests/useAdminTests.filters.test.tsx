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
  },
}));

vi.mock('@/services/api', () => ({ api: mocks.api }));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ hasPermission: () => true }) }));

import { useAdminTests } from './useAdminTests';

const t = (over: Partial<MockTest>) =>
  ({ status: 'published', isActive: true, title: over.id, ...over }) as MockTest;

const tests = [
  t({ id: 'fm1', testType: 'full_mock', examId: 'wbpsc' }),
  t({ id: 'fm2', testType: 'full_mock', examId: 'wbp' }),
  t({ id: 'pyq1', testType: 'pyq', examId: 'wbpsc' }),
  t({ id: 'tp1', testType: 'topic', examId: 'wbpsc', subjectId: 'hist', chapterId: 'indus' }),
  t({ id: 'tp2', testType: 'topic', examId: 'wbpsc', subjectId: 'hist', chapterId: 'vedic' }),
  t({ id: 'tp3', testType: 'topic', examId: 'wbpsc', subjectId: 'geo', chapterId: 'rivers' }),
];

function setup(tab: string) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[`/admin/tests?tab=${tab}`]}>{children}</MemoryRouter>
  );
  return renderHook(() => useAdminTests(), { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.api.getAllAdminTests.mockResolvedValue(tests);
  mocks.api.getExams.mockResolvedValue([
    { id: 'wbpsc', title: 'WBPSC Clerkship' },
    { id: 'wbp', title: 'WBP Constable' },
    { id: 'tet', title: 'Primary TET' },
  ]);
  mocks.api.getSubjects.mockResolvedValue([
    { id: 'hist', name: 'History' },
    { id: 'geo', name: 'Geography' },
    { id: 'math', name: 'Maths' },
  ]);
  mocks.api.getAllAdminChapters.mockResolvedValue([
    { id: 'indus', name: 'Indus', subjectId: 'hist' },
    { id: 'vedic', name: 'Vedic', subjectId: 'hist' },
    { id: 'rivers', name: 'Rivers', subjectId: 'geo' },
  ]);
});

describe('Mock Test Management filters', () => {
  it('Full Mock tab: lists exams with counts and filters by exam at once', async () => {
    const { result } = setup('full_mock');
    await waitFor(() => expect(result.current.filteredTests).toHaveLength(2));
    expect(result.current.examFilterOptions).toEqual([
      { id: 'wbpsc', title: 'WBPSC Clerkship', count: 1 },
      { id: 'wbp', title: 'WBP Constable', count: 1 },
    ]);

    act(() => result.current.changeExamFilter('wbp'));
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['fm2']);
  });

  it('Topic tab: filters by subject, then topic, at once', async () => {
    const { result } = setup('topic');
    await waitFor(() => expect(result.current.filteredTests).toHaveLength(3));
    expect(result.current.subjectFilterOptions.map((s) => `${s.name} ${s.count}`)).toEqual([
      'History 2',
      'Geography 1',
    ]);

    act(() => result.current.changeSubjectFilter('hist'));
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['tp1', 'tp2']);
    expect(result.current.chapterFilterOptions.map((c) => c.id)).toEqual(['indus', 'vedic']);

    act(() => result.current.changeChapterFilter('vedic'));
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['tp2']);

    // A new subject clears the topic choice
    act(() => result.current.changeSubjectFilter('geo'));
    expect(result.current.selectedChapterId).toBe('');
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['tp3']);
  });
});
