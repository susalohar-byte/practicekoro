import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const examState: { exams: unknown[]; selectedExam: { id: string; title: string } | null } = {
  exams: [],
  selectedExam: null,
};
vi.mock('@/context/ExamContext', () => ({
  useExam: () => ({ ...examState, setSelectedExam: vi.fn() }),
}));
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({ hasAccessToTest: () => true }),
}));
vi.mock('@/services/api', () => ({
  api: {
    getSubjects: vi.fn(),
    getExamTopicMappings: vi.fn(),
    getChapters: vi.fn(),
    getTests: vi.fn(),
  },
}));

import { api } from '@/services/api';
import { TopicTests } from './TopicTests';

const test = (id: string, testType: string, title: string, examId: string | null = null) =>
  ({
    id,
    testType,
    title,
    examId,
    chapterId: 't1',
    isPremium: false,
    totalQuestions: 10,
    durationMinutes: 15,
  }) as any;

const renderAt = (path = '/practice?tab=topics') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TopicTests />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  examState.selectedExam = null;
  vi.mocked(api.getSubjects).mockResolvedValue([
    { id: 's1', name: 'Arithmetic' },
    { id: 's2', name: 'History' },
  ] as any);
  vi.mocked(api.getExamTopicMappings).mockResolvedValue([]);
  vi.mocked(api.getChapters).mockImplementation(async (subjectId: string) =>
    subjectId === 's2'
      ? ([{ id: 't2', subjectId: 's2', name: 'Mughal Empire' }] as any)
      : ([{ id: 't1', subjectId: 's1', name: 'Percentage' }] as any)
  );
  vi.mocked(api.getTests).mockResolvedValue([
    test('topic-1', 'topic', 'Percentage Drill'),
    test('chapter-1', 'chapter_mock', 'Percentage Chapter Mock'),
    test('mock-1', 'full_mock', 'Leaky Full Mock', 'exam-1'),
    test('pyq-1', 'pyq', 'Leaky PYQ', 'exam-1'),
  ]);
});

describe('Topic-based discovery', () => {
  it('lists exam-independent topic tests with no exam selected and excludes Full Mocks/PYQs', async () => {
    renderAt();
    expect((await screen.findAllByText('Percentage Drill')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Percentage Chapter Mock').length).toBeGreaterThan(0);
    expect(screen.queryByText('Leaky Full Mock')).not.toBeInTheDocument();
    expect(screen.queryByText('Leaky PYQ')).not.toBeInTheDocument();
    expect(api.getSubjects).toHaveBeenCalledWith();
    expect(api.getTests).toHaveBeenCalledWith('t1', undefined);
  });

  it('honours ?subjectId=&topicId= deep links', async () => {
    renderAt('/practice?tab=topics&subjectId=s2&topicId=t2');
    await screen.findAllByText('Percentage Drill');
    expect(api.getChapters).toHaveBeenCalledWith('s2');
    expect(api.getTests).toHaveBeenCalledWith('t2', undefined);
  });

  it('scopes topics to the selected exam topic mapping', async () => {
    examState.selectedExam = { id: 'exam-1', title: 'WBCS' };
    vi.mocked(api.getExamTopicMappings).mockResolvedValue(['t-other']);
    renderAt();
    await vi.waitFor(() => expect(api.getChapters).toHaveBeenCalledWith('s1'));
    expect(api.getSubjects).toHaveBeenCalledWith('exam-1');
    // Topic t1 is not mapped to the exam, so no tests are requested for it.
    await new Promise((r) => setTimeout(r, 20));
    expect(api.getTests).not.toHaveBeenCalled();
  });
});
