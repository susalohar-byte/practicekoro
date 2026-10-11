import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AdminAnalytics, analyticsCsv } from './AdminAnalytics';
import { api } from '@/services/api';
import type { PlatformAnalyticsData } from '@/types';
vi.mock('@/services/api', () => ({
  api: {
    getPlatformAnalyticsOverview: vi.fn(),
    createNotification: vi.fn(),
    createTargetedNotification: vi.fn(),
  },
}));
const data: PlatformAnalyticsData = {
  studentPerformance: {
    totalStudents: 12,
    newStudents: 2,
    activeStudents: 3,
    testsAttempted: 4,
    questionsAnswered: 5,
    overallAccuracy: 20,
    performanceTrend: [],
  },
  studentRankings: [],
  questionInsights: { weakestSubjects: [], weakestTopics: [], mostWrongQuestions: [] },
  revenue: {
    totalRevenue: 80,
    monthlyRevenue: 30,
    paidStudents: 1,
    activeSubscriptions: 2,
    revenueTrend: [],
  },
};
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.mocked(api.getPlatformAnalyticsOverview).mockResolvedValue(data);
});
describe('Analytics truthful UI', () => {
  it('reloads the backend for range changes and has no estimated gender distribution', async () => {
    render(<AdminAnalytics />);
    await screen.findByText('₹80');
    fireEvent.change(screen.getByLabelText('Reporting period'), { target: { value: '7d' } });
    await waitFor(() =>
      expect(api.getPlatformAnalyticsOverview).toHaveBeenLastCalledWith('7d', undefined, undefined)
    );
    expect(screen.queryByText('(65%)')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dispatch Topic Practice Pack/ })).toBeDisabled();
  });
  it('shows load errors, disables export, and retries without fake zero cards', async () => {
    vi.mocked(api.getPlatformAnalyticsOverview).mockRejectedValueOnce(
      new Error('permission denied')
    );
    render(<AdminAnalytics />);
    expect(await screen.findByRole('alert')).toHaveTextContent('permission denied');
    expect(screen.getByRole('button', { name: 'Export Report' })).toBeDisabled();
    expect(screen.queryByText('Total Students')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('₹80');
  });
  it('ignores stale responses after newer range data arrives', async () => {
    let resolve!: (x: PlatformAnalyticsData) => void;
    vi.mocked(api.getPlatformAnalyticsOverview)
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          })
      )
      .mockResolvedValueOnce({ ...data, revenue: { ...data.revenue, totalRevenue: 55 } });
    render(<AdminAnalytics />);
    fireEvent.change(screen.getByLabelText('Reporting period'), { target: { value: '7d' } });
    await screen.findByText('₹55');
    resolve(data);
    await waitFor(() => expect(screen.queryByText('₹80')).not.toBeInTheDocument());
  });
  it('rejects invalid custom ranges without a backend mutation or export', async () => {
    render(<AdminAnalytics />);
    await screen.findByText('₹80');
    fireEvent.change(screen.getByLabelText('Reporting period'), { target: { value: 'custom' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-10-08' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-10-07' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('valid start date');
    expect(screen.getByRole('button', { name: 'Export Report' })).toBeDisabled();
  });
  it('exports actual new student counts and distinguishes current snapshots', () => {
    const csv = analyticsCsv(data, 'selected period');
    expect(csv).toContain('"New students","2","selected period"');
    expect(csv).toContain('"Total students","12","Current student profiles"');
    expect(csv).toContain('"Retained revenue (INR)","80","selected period"');
  });
  it('shows real zeros and no invented trends, categories or plan splits', async () => {
    vi.mocked(api.getPlatformAnalyticsOverview).mockResolvedValue({
      ...data,
      studentPerformance: { ...data.studentPerformance, totalStudents: 0, activeStudents: 0 },
    });
    render(<AdminAnalytics />);
    await screen.findByText('₹80');
    expect(screen.queryByText('12,486')).not.toBeInTheDocument();
    expect(screen.queryByText('↑ 18%')).not.toBeInTheDocument();
    expect(screen.queryByText('WBP Constable')).not.toBeInTheDocument();
    expect(screen.queryByText('6 Months Mock Test')).not.toBeInTheDocument();
    expect(screen.queryByText('Device Usage')).not.toBeInTheDocument();
    expect(screen.getByText('₹30')).toBeInTheDocument();
  });
  it('reports a failed practice pack dispatch and targets only active students', async () => {
    const topic = {
      chapterId: 'c1',
      chapterName: 'Polity',
      subjectName: 'GK',
      totalQuestionsAttempted: 4,
      accuracyRate: 25,
    };
    vi.mocked(api.getPlatformAnalyticsOverview).mockResolvedValue({
      ...data,
      studentRankings: [
        {
          rank: 1,
          userId: 'u1',
          name: 'A',
          email: 'a@example.test',
          totalTests: 1,
          questionsAttempted: 4,
          correctCount: 1,
          accuracy: 25,
          totalScore: 1,
          isPro: false,
        },
      ],
      questionInsights: { ...data.questionInsights, weakestTopics: [topic] },
    } as PlatformAnalyticsData);
    vi.mocked((api as any).createTargetedNotification).mockResolvedValue({
      success: false,
      error: 'denied',
    });
    render(<AdminAnalytics />);
    await screen.findByText('₹80');
    fireEvent.change(screen.getByDisplayValue('Select a topic to target...'), {
      target: { value: 'c1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Dispatch Topic Practice Pack/ }));
    expect(await screen.findByText(/Practice pack was not sent: denied/)).toBeInTheDocument();
    expect((api as any).createTargetedNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userIds: ['u1'] })
    );
    expect(api.createNotification).not.toHaveBeenCalled();
  });
});
