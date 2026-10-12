import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { CreateMockTestModal } from './CreateMockTestModal';
import { api } from '@/services/api';
import type { Chapter, Exam, MockTest, Subject, TestSeries } from '@/types';

const exams = [
  { id: 'e1', title: 'WBP Constable', category: 'Police' },
  { id: 'e2', title: 'WBCS', category: 'Civil' },
] as Exam[];
const subjects = [
  { id: 's1', name: 'General Science' },
  { id: 's2', name: 'History' },
] as Subject[];
const chapters = [
  { id: 't1', name: 'Heat', subjectId: 's1' },
  { id: 't2', name: 'Light', subjectId: 's1' },
  { id: 't3', name: 'Mughals', subjectId: 's2' },
] as Chapter[];
const series = [
  { id: 'sr-wbp', title: 'WBP Series', examId: 'e1' },
  { id: 'sr-wbcs', title: 'WBCS Series', examId: 'e2' },
  { id: 'sr-open', title: 'Science Topics', examId: '' },
] as TestSeries[];

const created = { id: 'new-1', title: 'Created' } as MockTest;

function renderModal(initialType: 'full_mock' | 'topic' | 'pyq' = 'full_mock') {
  const onTestCreated = vi.fn();
  const onClose = vi.fn();
  render(
    <CreateMockTestModal
      isOpen
      onClose={onClose}
      exams={exams}
      subjects={subjects}
      chapters={chapters}
      onTestCreated={onTestCreated}
      initialType={initialType}
    />
  );
  return { onTestCreated, onClose };
}

const fillTitle = (v = 'My Test') =>
  fireEvent.change(screen.getByLabelText('Test Title'), { target: { value: v } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: /\+ Create Mock Test/ }));

let createSpy: ReturnType<typeof vi.spyOn>;
let assignSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api, 'getTestSeries').mockResolvedValue(series);
  createSpy = vi.spyOn(api, 'createTest').mockResolvedValue(created);
  assignSpy = vi.spyOn(api, 'assignTestsToSeries').mockResolvedValue(undefined);
});

describe('CreateMockTestModal', () => {
  it('offers only Full Mock, Topic Test and Official PYQ', () => {
    renderModal();
    const pressed = screen.getAllByRole('button', { pressed: false });
    const labels = [screen.getByRole('button', { pressed: true }), ...pressed].map(
      (b) => b.textContent
    );
    expect(labels.some((l) => l?.includes('Full Mock'))).toBe(true);
    expect(labels.some((l) => l?.includes('Topic Test'))).toBe(true);
    expect(labels.some((l) => l?.includes('Official PYQ'))).toBe(true);
    expect(screen.queryByText(/Subject Test/i)).toBeNull();
  });

  it('requires an exam for a Full Mock with an inline message', async () => {
    renderModal('full_mock');
    fillTitle();
    submit();
    expect(await screen.findByText('Select the exam this Full Mock is for.')).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Target Exam *'), { target: { value: 'e1' } });
    submit();
    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ testType: 'full_mock', examId: 'e1', status: 'draft' })
      )
    );
  });

  it('requires exam and year for an Official PYQ; paper and set are optional', async () => {
    renderModal('pyq');
    fillTitle();
    submit();
    expect(await screen.findByText('Select the exam this paper is from.')).toBeInTheDocument();
    expect(screen.getByText('Enter the exam year.')).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Target Exam *'), { target: { value: 'e2' } });
    fireEvent.change(screen.getByLabelText('Exam Year *'), { target: { value: '2021' } });
    submit();
    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          testType: 'pyq',
          examId: 'e2',
          year: 2021,
          paperName: undefined,
          setName: undefined,
        })
      )
    );
  });

  it('creates a Topic Test without an exam; topics follow the selected subject', async () => {
    renderModal('topic');
    expect(screen.queryByLabelText('Target Exam *')).toBeNull();
    fillTitle();
    submit();
    expect(await screen.findByText('Select a subject.')).toBeInTheDocument();
    expect(screen.getByText('Select a topic.')).toBeInTheDocument();

    const topic = screen.getByLabelText('Topic *') as HTMLSelectElement;
    expect(topic).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Subject *'), { target: { value: 's1' } });
    expect(within(topic).queryByText('Mughals')).toBeNull();
    expect(within(topic).getByText('Heat')).toBeInTheDocument();
    fireEvent.change(topic, { target: { value: 't2' } });
    // Changing subject resets the topic.
    fireEvent.change(screen.getByLabelText('Subject *'), { target: { value: 's2' } });
    expect(topic.value).toBe('');
    fireEvent.change(topic, { target: { value: 't3' } });

    submit();
    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          testType: 'topic',
          examId: undefined,
          subjectId: 's2',
          chapterId: 't3',
        })
      )
    );
  });

  it('uses Free / Paid access labels', () => {
    renderModal();
    const access = screen.getByLabelText('Access');
    expect(within(access).getByRole('option', { name: 'Free' })).toBeInTheDocument();
    expect(within(access).getByRole('option', { name: 'Paid' })).toBeInTheDocument();
    expect(screen.queryByText(/PRO Members/i)).toBeNull();
  });

  it('disables series that cannot hold the chosen type/exam and adds the new test to the picked one', async () => {
    const { onTestCreated, onClose } = renderModal('full_mock');
    fillTitle();
    fireEvent.change(screen.getByLabelText('Target Exam *'), { target: { value: 'e1' } });
    const seriesSelect = screen.getByLabelText('Add to Test Series (optional)');
    const wbcs = await within(seriesSelect).findByRole('option', { name: /WBCS Series/ });
    expect(wbcs).toBeDisabled();
    expect(wbcs.textContent).toMatch(/different exam/);
    expect(within(seriesSelect).getByRole('option', { name: 'WBP Series' })).not.toBeDisabled();
    expect(within(seriesSelect).getByRole('option', { name: 'Science Topics' })).not.toBeDisabled();

    fireEvent.change(seriesSelect, { target: { value: 'sr-wbp' } });
    submit();
    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith(['new-1'], 'sr-wbp'));
    expect(onTestCreated).toHaveBeenCalledWith(created);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('keeps the created test and shows a non-fatal warning when series assignment fails', async () => {
    assignSpy.mockRejectedValue(new Error('series is archived'));
    const { onTestCreated, onClose } = renderModal('topic');
    fillTitle('Heat drill');
    fireEvent.change(screen.getByLabelText('Subject *'), { target: { value: 's1' } });
    fireEvent.change(screen.getByLabelText('Topic *'), { target: { value: 't1' } });
    const seriesSelect = screen.getByLabelText('Add to Test Series (optional)');
    await within(seriesSelect).findByRole('option', { name: 'WBCS Series' });
    // Topic Tests are compatible with every series.
    expect(within(seriesSelect).getByRole('option', { name: 'WBCS Series' })).not.toBeDisabled();
    fireEvent.change(seriesSelect, { target: { value: 'sr-open' } });
    submit();

    expect(await screen.findByText(/was created, but it could not be added/)).toHaveTextContent(
      'series is archived'
    );
    expect(onTestCreated).toHaveBeenCalledWith(created);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call series assignment when no series is chosen', async () => {
    renderModal('full_mock');
    fillTitle();
    fireEvent.change(screen.getByLabelText('Target Exam *'), { target: { value: 'e1' } });
    submit();
    await waitFor(() => expect(createSpy).toHaveBeenCalled());
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('shows database rule errors verbatim', async () => {
    createSpy.mockRejectedValue(new Error('A Full Mock test must be linked to an exam'));
    renderModal('full_mock');
    fillTitle();
    fireEvent.change(screen.getByLabelText('Target Exam *'), { target: { value: 'e1' } });
    submit();
    expect(
      await screen.findByText('A Full Mock test must be linked to an exam')
    ).toBeInTheDocument();
  });
});
