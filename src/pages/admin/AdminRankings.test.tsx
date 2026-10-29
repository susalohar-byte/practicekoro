import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminRankings } from './AdminRankings';
import { api } from '@/services/api';

vi.mock('@/services/api', () => ({
  api: {
    getAllAdminExams: vi.fn().mockResolvedValue([]),
    getAllAdminSubjects: vi.fn().mockResolvedValue([]),
    getLiveTests: vi.fn().mockResolvedValue([]),
    getLiveTestLeaderboard: vi.fn().mockResolvedValue([]),
    fetchLiveTestParticipations: vi.fn().mockResolvedValue([]),
    getAdminRankings: vi.fn(),
  },
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminRankings />
    </MemoryRouter>
  );

describe('AdminRankings real data states', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows an empty state, not seeded sample students, when nothing matches', async () => {
    vi.mocked(api.getAdminRankings).mockResolvedValue([]);
    renderPage();
    expect(
      await screen.findByText('No completed attempts match these filters.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Rohit Kumar')).not.toBeInTheDocument();
  });

  it('shows an error state with retry when rankings fail to load', async () => {
    vi.mocked(api.getAdminRankings).mockRejectedValue(new Error('permission denied'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('permission denied');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('switches to Live Tests scope and displays live tests empty state when no attempts exist', async () => {
    vi.mocked(api.getAdminRankings).mockResolvedValue([]);
    vi.mocked(api.getLiveTests).mockResolvedValue([]);
    renderPage();

    const liveTestsTab = await screen.findByRole('button', { name: /Live Tests/i });
    expect(liveTestsTab).toBeInTheDocument();

    fireEvent.click(liveTestsTab);

    expect(
      await screen.findByText('No student attempts have been submitted for Live Tests yet.')
    ).toBeInTheDocument();
  });

  it('renders student rankings for Live Tests when live test leaderboard returns participants', async () => {
    vi.mocked(api.getAdminRankings).mockResolvedValue([]);
    vi.mocked(api.getLiveTests).mockResolvedValue([
      {
        id: 'lt-1',
        testId: 'test-1',
        title: 'WBP Constable 2026 Live Mock',
        examName: 'WBP Constable',
        startAt: new Date().toISOString(),
        status: 'published',
        rankingEnabled: true,
        subscriptionRequired: false,
        totalQuestions: 100,
      } as any,
    ]);
    vi.mocked(api.getLiveTestLeaderboard).mockResolvedValue([
      {
        id: 'p-1',
        liveTestId: 'lt-1',
        userId: 'user-101',
        rank: 1,
        fullName: 'Sourav Ganguly',
        district: 'Kolkata',
        score: 88,
        accuracy: 92,
        timeTaken: 3600,
        status: 'completed',
        registeredAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    ]);

    renderPage();

    const liveTestsTab = await screen.findByRole('button', { name: /Live Tests/i });
    fireEvent.click(liveTestsTab);

    await waitFor(() => {
      expect(screen.getAllByText('Sourav Ganguly').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Kolkata, West Bengal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('88%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('92%').length).toBeGreaterThan(0);
  });

  it('reads live tests and participations once and reuses them for every event leaderboard', async () => {
    vi.mocked(api.getAdminRankings).mockResolvedValue([]);
    const events = ['lt-1', 'lt-2', 'lt-3'].map(
      (id) =>
        ({
          id,
          testId: `test-${id}`,
          title: `Live ${id}`,
          startAt: new Date().toISOString(),
          status: 'ended',
        }) as any
    );
    vi.mocked(api.getLiveTests).mockResolvedValue(events);
    vi.mocked(api.fetchLiveTestParticipations).mockResolvedValue([]);
    vi.mocked(api.getLiveTestLeaderboard).mockResolvedValue([]);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Live Tests/i }));
    await waitFor(() => expect(api.getLiveTestLeaderboard).toHaveBeenCalledTimes(3));

    expect(api.getLiveTests).toHaveBeenCalledTimes(1);
    expect(api.fetchLiveTestParticipations).toHaveBeenCalledTimes(1);
    for (const lt of events) {
      expect(api.getLiveTestLeaderboard).toHaveBeenCalledWith(lt.id, {
        participations: [],
        liveTest: lt,
      });
    }
  });
});
