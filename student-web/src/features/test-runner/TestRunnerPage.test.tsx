import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Question, ServerAttempt } from '@/types/models';

const api = vi.hoisted(() => ({
  startAttempt: vi.fn(),
  fetchQuestions: vi.fn(),
  saveAnswers: vi.fn(),
  submitAttempt: vi.fn(),
}));

vi.mock('@/services/attempts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/attempts')>()),
  ...api,
}));
vi.mock('@/lib/supabase', () => ({ supabase: {} }));
vi.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));

import TestRunnerPage from './TestRunnerPage';
import { loadDraft, saveDraft } from '@/services/attempts';

const question = (id: string, over: Partial<Question> = {}): Question => ({
  id,
  order: 1,
  textEnglish: `Question text ${id}`,
  textBengali: null,
  imageUrl: null,
  options: { A: `${id}-a`, B: `${id}-b`, C: `${id}-c`, D: `${id}-d` },
  marks: 1,
  negativeMarks: 0.25,
  ...over,
});

const attempt = (over: Partial<ServerAttempt> = {}): ServerAttempt => ({
  id: 'att-1',
  testId: 't1',
  startedAt: new Date(),
  durationMinutes: 10,
  ...over,
});

let queryClient: QueryClient;

function renderRunner(path = '/test/t1/run?title=Mock%20Test%201') {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/test/:testId/run" element={<TestRunnerPage />} />
          <Route path="/result/:attemptId" element={<p>result page</p>} />
          <Route path="/test/:testId/details" element={<p>details page</p>} />
          <Route path="/plans" element={<p>plans page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const optionsGroup = () => screen.getByRole('radiogroup');
const option = (letter: string) =>
  within(optionsGroup())
    .getAllByRole('radio')
    .find((r) => r.textContent?.startsWith(letter)) as HTMLElement;

beforeAll(() => {
  // jsdom does not implement scrollIntoView (used to keep the palette item visible).
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  localStorage.clear();
  for (const fn of Object.values(api)) fn.mockReset();
  api.saveAnswers.mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe('TestRunnerPage — starting', () => {
  it('starts the attempt, loads questions and shows the first one', async () => {
    api.startAttempt.mockResolvedValue(attempt());
    api.fetchQuestions.mockResolvedValue([question('q1'), question('q2')]);
    renderRunner();
    expect(await screen.findByText('Question 1 of 2')).toBeTruthy();
    expect(api.startAttempt).toHaveBeenCalledWith('t1');
    expect(api.startAttempt).toHaveBeenCalledTimes(1);
    expect(api.fetchQuestions).toHaveBeenCalledWith('t1');
    expect(screen.getByText('Mock Test 1')).toBeTruthy();
    expect(screen.getByText('Question text q1')).toBeTruthy();
    expect(screen.getByRole('timer').getAttribute('aria-label')).toMatch(
      /^Time left (10:00|09:59)$/
    );
  });

  it('shows Bengali text first with English underneath', async () => {
    api.startAttempt.mockResolvedValue(attempt());
    api.fetchQuestions.mockResolvedValue([question('q1', { textBengali: 'বাংলা প্রশ্ন' })]);
    renderRunner();
    expect(await screen.findByText('বাংলা প্রশ্ন')).toBeTruthy();
    expect(screen.getByText('Question text q1')).toBeTruthy();
  });

  it('only renders the options that have text', async () => {
    api.startAttempt.mockResolvedValue(attempt());
    api.fetchQuestions.mockResolvedValue([
      question('q1', { options: { A: 'Yes', B: 'No', C: '', D: '' } }),
    ]);
    renderRunner();
    await screen.findByText('Question 1 of 1');
    expect(within(optionsGroup()).getAllByRole('radio')).toHaveLength(2);
  });

  it('shows a friendly error with a retry when the attempt cannot start', async () => {
    api.startAttempt.mockRejectedValueOnce({ code: '40400', message: 'not found' });
    renderRunner();
    expect(await screen.findByText('Could not start this test')).toBeTruthy();
    expect(screen.getByText('This test is not available right now.')).toBeTruthy();
    expect(screen.queryByText('View Plans')).toBeNull();

    api.startAttempt.mockResolvedValue(attempt());
    api.fetchQuestions.mockResolvedValue([question('q1')]);
    fireEvent.click(screen.getByText('Try again'));
    expect(await screen.findByText('Question 1 of 1')).toBeTruthy();
    expect(api.startAttempt).toHaveBeenCalledTimes(2);
  });

  it('offers the plans page when the test needs a Pro Pass', async () => {
    api.startAttempt.mockRejectedValue({ code: '40300', message: 'Pro pass required' });
    renderRunner();
    fireEvent.click(await screen.findByText('View Plans'));
    expect(screen.getByText('plans page')).toBeTruthy();
  });

  it('shows an empty state when the test has no questions', async () => {
    api.startAttempt.mockResolvedValue(attempt());
    api.fetchQuestions.mockResolvedValue([]);
    renderRunner();
    expect(await screen.findByText('No questions in this test yet')).toBeTruthy();
  });

  it('shows an error state when questions fail to load', async () => {
    api.startAttempt.mockResolvedValue(attempt());
    api.fetchQuestions.mockRejectedValue(new Error('boom'));
    renderRunner();
    expect(await screen.findByText('Could not load the questions.')).toBeTruthy();
  });

  it('restores answers, marks and position from the local draft', async () => {
    saveDraft('att-1', { answers: { q1: 'C' }, marked: ['q2'], index: 1 });
    api.startAttempt.mockResolvedValue(attempt());
    api.fetchQuestions.mockResolvedValue([question('q1'), question('q2')]);
    renderRunner();
    expect(await screen.findByText('Question 2 of 2')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Marked for Review' }).getAttribute('aria-pressed')
    ).toBe('true');
    expect(screen.getAllByRole('button', { name: 'Question 1, answered' })).not.toHaveLength(0);
  });
});

describe('TestRunnerPage — answering', () => {
  beforeEach(() => {
    api.startAttempt.mockResolvedValue(attempt());
    api.fetchQuestions.mockResolvedValue([question('q1'), question('q2'), question('q3')]);
  });

  it('picks an option, autosaves and keeps the draft in sync', async () => {
    renderRunner();
    await screen.findByText('Question 1 of 3');
    fireEvent.click(option('B'));
    expect(option('B').getAttribute('aria-checked')).toBe('true');
    expect(api.saveAnswers).toHaveBeenCalledWith('att-1', { q1: 'B' }, expect.any(Number));
    expect(loadDraft('att-1')).toEqual({ answers: { q1: 'B' }, marked: [], index: 0 });
  });

  it('clears the response and autosaves the removal', async () => {
    renderRunner();
    await screen.findByText('Question 1 of 3');
    const clear = screen.getByRole('button', { name: 'Clear' }) as HTMLButtonElement;
    expect(clear.disabled).toBe(true);
    fireEvent.click(option('A'));
    expect(clear.disabled).toBe(false);
    fireEvent.click(clear);
    expect(option('A').getAttribute('aria-checked')).toBe('false');
    expect(api.saveAnswers).toHaveBeenLastCalledWith('att-1', {}, expect.any(Number));
  });

  it('moves with Next/Previous and the palette, and shows Submit on the last question', async () => {
    renderRunner();
    await screen.findByText('Question 1 of 3');
    expect((screen.getByRole('button', { name: /Previous/ }) as HTMLButtonElement).disabled).toBe(
      true
    );
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('Question 2 of 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Previous/ }));
    expect(screen.getByText('Question 1 of 3')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /^Question 3, not answered/ })[0]);
    expect(screen.getByText('Question 3 of 3')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Next/ })).toBeNull();
  });

  it('toggles Mark for Review and reflects it in the palette', async () => {
    renderRunner();
    await screen.findByText('Question 1 of 3');
    fireEvent.click(screen.getByRole('button', { name: 'Mark for Review' }));
    expect(
      screen.getAllByRole('button', {
        name: 'Question 1, not answered, marked for review, current',
      })
    ).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Marked for Review' }));
    expect(screen.getByRole('button', { name: 'Mark for Review' })).toBeTruthy();
  });

  it('supports keyboard shortcuts for options, navigation, marking and clearing', async () => {
    renderRunner();
    await screen.findByText('Question 1 of 3');
    fireEvent.keyDown(document.body, { key: '3' });
    expect(option('C').getAttribute('aria-checked')).toBe('true');
    fireEvent.keyDown(document.body, { key: 'd' });
    expect(option('D').getAttribute('aria-checked')).toBe('true');
    fireEvent.keyDown(document.body, { key: 'Backspace' });
    expect(option('D').getAttribute('aria-checked')).toBe('false');
    fireEvent.keyDown(document.body, { key: 'm' });
    expect(screen.getByRole('button', { name: 'Marked for Review' })).toBeTruthy();
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(screen.getByText('Question 2 of 3')).toBeTruthy();
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    expect(screen.getByText('Question 1 of 3')).toBeTruthy();
  });

  it('ignores shortcuts with modifier keys', async () => {
    renderRunner();
    await screen.findByText('Question 1 of 3');
    fireEvent.keyDown(document.body, { key: 'a', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: 'C', shiftKey: true });
    expect(option('A').getAttribute('aria-checked')).toBe('false');
    expect(option('C').getAttribute('aria-checked')).toBe('false');
    expect(api.saveAnswers).not.toHaveBeenCalled();
  });
});

describe('TestRunnerPage — submitting', () => {
  beforeEach(() => {
    api.startAttempt.mockResolvedValue(attempt());
    api.fetchQuestions.mockResolvedValue([question('q1'), question('q2')]);
  });

  it('confirms with the answered / not answered / marked counts and submits', async () => {
    api.submitAttempt.mockResolvedValue(undefined);
    renderRunner();
    await screen.findByText('Question 1 of 2');
    fireEvent.click(option('A'));
    fireEvent.click(screen.getByRole('button', { name: 'Mark for Review' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Submit' })[0]);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Submit Test?')).toBeTruthy();
    const counts = within(dialog)
      .getAllByText(/^(Answered|Not Answered|Marked)$/)
      .map((el) => `${el.textContent}:${el.previousElementSibling?.textContent}`);
    expect(counts).toEqual(['Answered:1', 'Not Answered:1', 'Marked:1']);

    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit Test' }));
    expect(await screen.findByText('result page')).toBeTruthy();
    expect(api.submitAttempt).toHaveBeenCalledWith('att-1', { q1: 'A' }, expect.any(Number));
    expect(loadDraft('att-1')).toBeNull();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['attempt-history', 'u1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['attempts-in-progress', 'u1'] });
  });

  it('cancels the confirmation without submitting', async () => {
    renderRunner();
    await screen.findByText('Question 1 of 2');
    fireEvent.click(screen.getAllByRole('button', { name: 'Submit' })[0]);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(api.submitAttempt).not.toHaveBeenCalled();
  });

  it('shows the submit error and lets the student retry', async () => {
    api.submitAttempt
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(undefined);
    renderRunner();
    await screen.findByText('Question 1 of 2');
    fireEvent.click(screen.getAllByRole('button', { name: 'Submit' })[0]);
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Submit Test' })
    );
    expect(
      await screen.findByText('Could not reach the server. Check your internet and try again.')
    ).toBeTruthy();
    expect(loadDraft('att-1')).not.toBeNull();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('result page')).toBeTruthy();
    expect(api.submitAttempt).toHaveBeenCalledTimes(2);
  });

  it("auto-submits when the time is already up and shows the Time's Up dialog", async () => {
    api.startAttempt.mockResolvedValue(attempt({ startedAt: new Date(Date.now() - 11 * 60_000) }));
    api.submitAttempt.mockResolvedValue(undefined);
    renderRunner();
    expect(await screen.findByText("Time's Up!")).toBeTruthy();
    expect(api.submitAttempt).toHaveBeenCalledTimes(1);
    // Time spent is capped at the test duration.
    expect(api.submitAttempt).toHaveBeenCalledWith('att-1', {}, 600);
    fireEvent.click(screen.getByRole('button', { name: 'View Results' }));
    expect(screen.getByText('result page')).toBeTruthy();
  });

  it('surfaces an auto-submit failure as a banner with retry', async () => {
    api.startAttempt.mockResolvedValue(attempt({ startedAt: new Date(Date.now() - 11 * 60_000) }));
    api.submitAttempt
      .mockRejectedValueOnce({ message: 'Attempt already closed' })
      .mockResolvedValueOnce(undefined);
    renderRunner();
    const banner = await screen.findByText(/Submission Failed: Attempt already closed/);
    expect(api.submitAttempt).toHaveBeenCalledTimes(1);
    fireEvent.click(
      within(banner.parentElement as HTMLElement).getByRole('button', { name: 'Retry' })
    );
    expect(await screen.findByText('result page')).toBeTruthy();
  });

  it('counts the timer down from the server start time', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      api.startAttempt.mockResolvedValue(attempt({ startedAt: new Date(Date.now() - 4 * 60_000) }));
      renderRunner();
      await screen.findByText('Question 1 of 2');
      expect(screen.getByRole('timer').getAttribute('aria-label')).toMatch(
        /Time left 0(6:00|5:59)/
      );
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByRole('timer').getAttribute('aria-label')).toMatch(
        /Time left 0(5:00|4:59)/
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('TestRunnerPage — leaving', () => {
  it('asks before leaving and returns to the test details', async () => {
    api.startAttempt.mockResolvedValue(attempt());
    api.fetchQuestions.mockResolvedValue([question('q1')]);
    renderRunner();
    await screen.findByText('Question 1 of 1');
    fireEvent.click(screen.getByRole('button', { name: 'Leave test' }));
    expect(screen.getByText('Leave test?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
    expect(screen.queryByText('Leave test?')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Leave test' }));
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    await waitFor(() => expect(screen.getByText('details page')).toBeTruthy());
  });
});
