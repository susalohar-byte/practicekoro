import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { api } from '@/services/api';
import { EXAMS_UPDATED_EVENT } from '@/lib/dataSync';
import { ExamProvider, useExam } from './ExamContext';

vi.mock('@/services/api', () => ({
  api: {
    getExams: vi.fn(),
  },
}));

const mockedGetExams = vi.mocked(api.getExams);

function Probe() {
  const { exams, loading } = useExam();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="count">{exams.length}</span>
      <span data-testid="first">{exams[0]?.title || 'none'}</span>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockedGetExams.mockResolvedValue([]);
});

describe('ExamContext live sync', () => {
  it('loads exams on mount', async () => {
    mockedGetExams.mockResolvedValueOnce([{ id: 'e1', title: 'WBP Constable' } as never]);
    render(
      <ExamProvider>
        <Probe />
      </ExamProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('1');
    });
    expect(mockedGetExams).toHaveBeenCalledTimes(1);
  });

  it('re-fetches when admin exams change (no reload needed)', async () => {
    mockedGetExams.mockResolvedValue([]);
    render(
      <ExamProvider>
        <Probe />
      </ExamProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(mockedGetExams).toHaveBeenCalledTimes(1);

    mockedGetExams.mockResolvedValueOnce([{ id: 'e9', title: 'New Exam From Admin' } as never]);
    await act(async () => {
      window.dispatchEvent(new CustomEvent(EXAMS_UPDATED_EVENT));
    });

    await waitFor(() => {
      expect(screen.getByTestId('first').textContent).toBe('New Exam From Admin');
    });
    expect(mockedGetExams).toHaveBeenCalledTimes(2);
  });
});
