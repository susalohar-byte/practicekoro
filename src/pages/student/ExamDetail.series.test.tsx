import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const exam = { id: 'exam-1', slug: 'wbcs', title: 'WBCS', category: 'State' };
const user = { id: 'u', role: 'student' };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user, isPro: true }),
}));
vi.mock('@/context/ExamContext', () => ({
  useExam: () => ({ exams: [exam], selectedExam: exam, setSelectedExam: vi.fn() }),
}));
vi.mock('@/services/api', () => ({
  api: {
    getTestsForExam: vi.fn(),
    getSubjects: vi.fn(async () => []),
    getExamSubjectsWithTopics: vi.fn(async () => []),
    getStudentTestSeries: vi.fn(),
    getTestSeries: vi.fn(),
    getSeriesTestsForStudent: vi.fn(),
  },
}));

import { api } from '@/services/api';
import { ExamDetail } from './ExamDetail';

const mock = (id: string, title: string, testSeriesId?: string) =>
  ({
    id,
    title,
    testType: 'full_mock',
    testSeriesId,
    isPremium: false,
    totalQuestions: 100,
    durationMinutes: 60,
    totalMarks: 100,
  }) as any;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/exams/:examId/full-mock" element={<ExamDetail />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getTestsForExam).mockImplementation(async (_examId, category) =>
    category === 'full_mock'
      ? [
          mock('m-primary-other', 'Mock In Series Via Membership', 'series-other'),
          mock('m-primary-here', 'Mock Primary Here Not Member', 'series-1'),
          mock('m-second', 'Second Member Mock'),
        ]
      : []
  );
  vi.mocked(api.getStudentTestSeries).mockResolvedValue([
    {
      id: 'series-1',
      examId: 'exam-1',
      title: 'Prelims Pack',
      isPremium: false,
      isActive: true,
      fullMockCount: 2,
      topicTestCount: 0,
      pyqTestCount: 0,
      testCount: 2,
    },
  ] as any);
  vi.mocked(api.getSeriesTestsForStudent).mockResolvedValue([
    { id: 'm-second' },
    { id: 'm-primary-other' },
  ] as any);
});

describe('Exam-based discovery', () => {
  it('uses the student series API, not the admin one', async () => {
    renderAt('/exams/exam-1/full-mock');
    expect((await screen.findAllByText('Prelims Pack')).length).toBeGreaterThan(0);
    expect(api.getStudentTestSeries).toHaveBeenCalledWith('exam-1');
    expect(api.getTestSeries).not.toHaveBeenCalled();
    // Series count comes from membership-derived series counts.
    expect(screen.getByText('2 Tests')).toBeInTheDocument();
  });

  it('filters a selected series by real membership, in membership order', async () => {
    renderAt('/exams/exam-1/full-mock?seriesId=series-1');
    const second = (await screen.findAllByText('Second Member Mock'))[0];
    const other = screen.getAllByText('Mock In Series Via Membership')[0];
    expect(screen.queryByText('Mock Primary Here Not Member')).not.toBeInTheDocument();
    expect(second.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(api.getSeriesTestsForStudent).toHaveBeenCalledWith('series-1');
  });
});
