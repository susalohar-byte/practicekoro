import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const user = { id: 'u' };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user, isPro: true, isAdmin: false }),
}));
vi.mock('@/services/api', () => ({
  api: {
    getStudentTestSeries: vi.fn(async () => [
      {
        id: 'series-1',
        slug: 'series-1',
        examId: 'exam-1',
        title: 'Membership Series',
        isActive: true,
        isPremium: false,
        fullMockCount: 2,
        topicTestCount: 0,
        pyqTestCount: 0,
        testCount: 2,
      },
    ]),
    // Membership order: Zeta first even though its own order_index/title sort later.
    getSeriesTestsForStudent: vi.fn(async () => [
      {
        id: 'z',
        title: 'Zeta Mock',
        testType: 'full_mock',
        orderIndex: 9,
        isPremium: false,
        totalQuestions: 5,
        durationMinutes: 10,
        totalMarks: 5,
      },
      {
        id: 'a',
        title: 'Alpha Mock',
        testType: 'full_mock',
        orderIndex: 1,
        isPremium: false,
        totalQuestions: 5,
        durationMinutes: 10,
        totalMarks: 5,
      },
    ]),
    getTestSeriesAnalytics: vi.fn(async () => null),
    getUserAttempts: vi.fn(async () => []),
  },
}));

import { TestSeriesDetail } from './TestSeriesDetail';

describe('Test Series discovery', () => {
  it('shows series tests in saved membership order', async () => {
    render(
      <MemoryRouter initialEntries={['/test-series/series-1']}>
        <Routes>
          <Route path="/test-series/:seriesId" element={<TestSeriesDetail />} />
        </Routes>
      </MemoryRouter>
    );
    const zeta = (await screen.findAllByText('Zeta Mock'))[0];
    const alpha = screen.getAllByText('Alpha Mock')[0];
    expect(zeta.compareDocumentPosition(alpha) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
