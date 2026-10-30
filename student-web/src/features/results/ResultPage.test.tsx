import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Attempt, AttemptRankings } from '@/types/models';

const q = vi.hoisted(() => ({
  attempt: {
    isLoading: false,
    isError: false,
    data: null as unknown,
    error: null,
    refetch: vi.fn(),
  },
  rankings: { data: null as unknown },
  test: { data: null as unknown },
  rankingsEnabled: [] as boolean[],
}));
const toast = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/queries', () => ({
  useAttempt: () => q.attempt,
  useAttemptRankings: (_id: string, enabled: boolean) => {
    q.rankingsEnabled.push(enabled);
    return q.rankings;
  },
  useTest: () => q.test,
}));
vi.mock('@/components/ui/Toast', () => ({ useToast: () => toast }));

import ResultPage from './ResultPage';

const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  id: 'att-1',
  testId: 't 1',
  testTitle: 'WBP Mock 3',
  examId: 'e1',
  category: 'Full Test',
  isLive: false,
  score: 42.5,
  totalMarks: 50,
  percentage: 85,
  accuracy: 88.4,
  correctCount: 45,
  wrongCount: 6,
  skippedCount: 9,
  timeSpentSeconds: 1865,
  completedAt: new Date(2026, 9, 25, 16, 30),
  rank: 12,
  totalCandidates: 340,
  percentile: 96.47,
  passed: true,
  ...over,
});

const rankings = (over: Partial<AttemptRankings> = {}): AttemptRankings => ({
  testSeries: { id: null, name: null, rank: null, participants: 0 },
  district: { name: 'Hooghly', rank: 3, participants: 120 },
  westBengal: { rank: 7, participants: 2400 },
  ...over,
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/result/att-1']}>
      <Routes>
        <Route path="/result/:attemptId" element={<ResultPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const rowValue = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

beforeEach(() => {
  q.attempt = { isLoading: false, isError: false, data: attempt(), error: null, refetch: vi.fn() };
  q.rankings = { data: null };
  q.test = { data: { negativeMarking: 0.25, totalQuestions: 60 } };
  q.rankingsEnabled = [];
  toast.mockReset();
});
afterEach(() => cleanup());

describe('ResultPage', () => {
  it('shows a loader while the attempt loads', () => {
    q.attempt = { ...q.attempt, isLoading: true, data: undefined };
    renderPage();
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('shows not found for a missing attempt and skips rankings', () => {
    q.attempt = { ...q.attempt, data: null };
    renderPage();
    expect(screen.getByText('Result not found')).toBeTruthy();
    expect(q.rankingsEnabled.every((e) => e === false)).toBe(true);
  });

  it('shows an error state with a retry', () => {
    q.attempt = { ...q.attempt, isError: true, data: undefined, error: new Error('x') as never };
    renderPage();
    expect(screen.getByText('Could not load your result detail.')).toBeTruthy();
  });

  it('renders the score summary and the breakdown rows', () => {
    renderPage();
    expect(screen.getByText('WBP Mock 3')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Score 42.5 out of 50' })).toBeTruthy();
    expect(screen.getByText('88%')).toBeTruthy();
    expect(screen.getByText('31m 5s')).toBeTruthy();
    expect(screen.getByText('Percentile 96.47')).toBeTruthy();
    expect(rowValue('Total Questions')).toBe('60');
    expect(rowValue('Attempted')).toBe('51');
    expect(rowValue('Correct')).toBe('45');
    expect(rowValue('Incorrect')).toBe('6');
    expect(rowValue('Skipped')).toBe('9');
    expect(rowValue('Negative Marking')).toBe('-1.5');
    expect(rowValue('Final Score')).toBe('42.5 / 50');
    expect(q.rankingsEnabled.slice(-1)[0]).toBe(true);
  });

  it('uses the attempt rank when there are no rankings and hides negative marking without the test', () => {
    q.test = { data: null };
    renderPage();
    expect(screen.getByText('12th')).toBeTruthy();
    expect(screen.getByText('(Out of 340)')).toBeTruthy();
    expect(screen.queryByText('Negative Marking')).toBeNull();
    expect(screen.queryByText('West Bengal')).toBeNull();
  });

  it('prefers the West Bengal rank and shows the district card', () => {
    q.rankings = { data: rankings() };
    renderPage();
    expect(screen.getAllByText('7th').length).toBeGreaterThan(0);
    expect(screen.getByText('(Out of 2,400)')).toBeTruthy();
    expect(screen.getByText('Hooghly')).toBeTruthy();
    expect(screen.getByText('3rd')).toBeTruthy();
    expect(screen.getByText('of 120')).toBeTruthy();
  });

  it('asks the student to add a district when none is set', () => {
    q.rankings = { data: rankings({ district: { name: null, rank: null, participants: 0 } }) };
    renderPage();
    expect(screen.getByRole('link', { name: 'Add your district' }).getAttribute('href')).toBe(
      '/profile/edit?section=location'
    );
  });

  it('shows a dash for the rank when nobody is ranked and no percentile', () => {
    q.attempt = {
      ...q.attempt,
      data: attempt({ rank: null, totalCandidates: null, percentile: null }),
    };
    renderPage();
    expect(screen.getByText('–')).toBeTruthy();
    expect(screen.queryByText(/Percentile/)).toBeNull();
  });

  it('links to solutions, re-attempt and the rank list', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /View Answer/ }).getAttribute('href')).toBe(
      '/solutions/att-1'
    );
    expect(screen.getByRole('link', { name: /Re-attempt Test/ }).getAttribute('href')).toBe(
      '/test/t%201/details'
    );
    expect(screen.getByRole('link', { name: /Rank List/ }).getAttribute('href')).toBe(
      '/results/rankings?testId=t%201&title=WBP%20Mock%203'
    );
  });

  it('copies a share summary when the Web Share API is missing', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Share Result' }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith('Result summary copied to clipboard!', 'success')
    );
    expect(writeText).toHaveBeenCalledWith('I scored 42.5/50 (85%) in WBP Mock 3 on PracticeKoro.');
  });

  it('uses the native share sheet when available', async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Share Result' }));
    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: 'My PracticeKoro result',
        text: expect.stringContaining('42.5/50'),
      })
    );
    expect(toast).not.toHaveBeenCalled();
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });
});
