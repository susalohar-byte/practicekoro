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
  getExamTestLinks: vi.fn(),
}));

vi.mock('@/services/api', () => ({ api: mocks.api }));
vi.mock('@/services/domains/admin.examMappings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/domains/admin.examMappings')>()),
  getExamTestLinks: mocks.getExamTestLinks,
}));
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
  // fm1 is also a WBP test; WBP's syllabus has the Vedic and Rivers topics
  mocks.getExamTestLinks.mockResolvedValue({
    testExams: [{ testId: 'fm1', examId: 'wbp' }],
    examTopics: [
      { examId: 'wbp', topicId: 'vedic' },
      { examId: 'wbp', topicId: 'rivers' },
    ],
  });
});

describe('Mock Test Management filters', () => {
  it('Full Mock tab: lists exams with counts and filters by exam at once', async () => {
    const { result } = setup('full_mock');
    await waitFor(() => expect(result.current.filteredTests).toHaveLength(2));
    // Every exam is listed, even one with no tests yet
    await waitFor(() =>
      expect(result.current.examFilterOptions).toEqual([
        { id: 'wbpsc', title: 'WBPSC Clerkship', count: 1 },
        { id: 'wbp', title: 'WBP Constable', count: 2 },
        { id: 'tet', title: 'Primary TET', count: 0 },
      ])
    );

    // fm1's main exam is WBPSC, but it is also linked to WBP
    act(() => result.current.changeExamFilter('wbp'));
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['fm1', 'fm2']);
  });

  it('All tab: an exam shows its mocks, PYQs and the topic tests on its topics', async () => {
    const { result } = setup('all');
    await waitFor(() => expect(result.current.examFilterOptions[1]?.count).toBe(4));

    act(() => result.current.changeExamFilter('wbp'));
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['fm1', 'fm2', 'tp2', 'tp3']);
  });

  it('Topic tab: exam narrows subjects and topics, and a new exam clears them', async () => {
    const { result } = setup('topic');
    await waitFor(() => expect(result.current.examFilterOptions[1]?.count).toBe(2));

    act(() => result.current.changeSubjectFilter('hist'));
    act(() => result.current.changeExamFilter('wbp'));
    expect(result.current.selectedSubjectId).toBe('');
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['tp2', 'tp3']);
    expect(result.current.subjectFilterOptions.map((s) => `${s.name} ${s.count}`)).toEqual([
      'History 1',
      'Geography 1',
    ]);

    act(() => result.current.changeSubjectFilter('hist'));
    expect(result.current.chapterFilterOptions.map((c) => c.id)).toEqual(['vedic']);
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['tp2']);
  });

  it("exam links failing to load: falls back to each test's main exam", async () => {
    mocks.getExamTestLinks.mockRejectedValue(new Error('offline'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = setup('full_mock');
    await waitFor(() => expect(result.current.filteredTests).toHaveLength(2));

    act(() => result.current.changeExamFilter('wbp'));
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['fm2']);
    warn.mockRestore();
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

  it('Type filter: an exam then Full Mock or PYQ, with counts for that exam', async () => {
    const { result } = setup('all');
    await waitFor(() => expect(result.current.filteredTests).toHaveLength(6));

    act(() => result.current.changeExamFilter('wbpsc'));
    expect(result.current.typeFilterOptions.map((o) => `${o.key} ${o.count}`)).toEqual([
      'all 5',
      'full_mock 1',
      'pyq 1',
      'topic 3',
    ]);

    act(() => result.current.handleTabChange('full_mock'));
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['fm1']);
    act(() => result.current.handleTabChange('pyq'));
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['pyq1']);
  });

  it('Type filter: switching to Full Mock clears a subject / topic choice', async () => {
    const { result } = setup('all');
    await waitFor(() => expect(result.current.filteredTests).toHaveLength(6));

    act(() => result.current.changeSubjectFilter('hist'));
    act(() => result.current.handleTabChange('full_mock'));
    expect(result.current.selectedSubjectId).toBe('');
    expect(result.current.filteredTests.map((x) => x.id)).toEqual(['fm1', 'fm2']);

    act(() => result.current.handleResetFilters());
    expect(result.current.activeTab).toBe('all');
  });
});
