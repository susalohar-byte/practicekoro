import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RankRow } from '@/types/models';

const q = vi.hoisted(() => ({ boardCalls: [] as { testId: string | null; scope: string }[] }));

vi.mock('@/hooks/queries', () => ({
  useAttemptHistory: () => ({
    isLoading: false,
    data: [{ testId: 't1', testTitle: 'WBP Mock 1', completedAt: new Date('2026-11-01'), totalMarks: 100 }],
  }),
  useProfile: () => ({ data: { district: 'Purulia' } }),
  useLeaderboard: (p: { testId: string | null; scope: string }) => {
    q.boardCalls.push({ testId: p.testId, scope: p.scope });
    const me: RankRow = {
      rank: 4,
      userId: 'me',
      name: 'Dipa',
      avatarUrl: null,
      score: 10,
      totalMarks: 50,
      percentage: 20,
      district: 'Purulia',
      block: null,
      isCurrentUser: true,
      testsAttempted: p.testId === '__overall__' ? 3 : undefined,
    };
    return { isLoading: false, isError: false, data: [me], refetch: vi.fn() };
  },
}));

import RankListPage from './RankListPage';

afterEach(() => {
  cleanup();
  q.boardCalls = [];
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/results/ranks']}>
      <RankListPage />
    </MemoryRouter>
  );

describe('RankListPage', () => {
  it('opens on the overall rank and still lets the student pick a test', () => {
    renderPage();
    const picker = screen.getByRole('combobox') as HTMLSelectElement;
    expect(picker.value).toBe('__overall__');
    expect(screen.getByRole('option', { name: 'Overall Rank (all tests)' })).toBeTruthy();
    expect(q.boardCalls[q.boardCalls.length - 1]).toEqual({ testId: '__overall__', scope: 'global' });
    expect(screen.getByText('Overall · 3 tests')).toBeTruthy();

    fireEvent.change(picker, { target: { value: 't1' } });
    expect(q.boardCalls[q.boardCalls.length - 1]).toEqual({ testId: 't1', scope: 'global' });
    expect(screen.queryByText(/Overall ·/)).toBeNull();
  });
});
