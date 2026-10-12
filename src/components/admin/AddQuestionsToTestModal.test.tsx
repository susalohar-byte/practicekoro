import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AddQuestionsToTestModal } from './AddQuestionsToTestModal';
import { api } from '@/services/api';
import type { Chapter, MockTest, Question, Subject, TestQuestionAssignment } from '@/types';

const subjects = [{ id: 's1', name: 'Science' }] as Subject[];
const chapters = [
  { id: 't1', name: 'Heat', subjectId: 's1' },
  { id: 't2', name: 'Light', subjectId: 's1' },
] as Chapter[];
const base = {
  slug: 's',
  durationMinutes: 30,
  totalQuestions: 0,
  totalMarks: 25,
  passingMarks: 10,
  negativeMarking: 0.25,
  isPremium: false,
  orderIndex: 0,
  isActive: true,
  status: 'draft' as const,
};
const q = (id: string, extra: Partial<Question> = {}) =>
  ({
    id,
    questionText: `Question ${id}`,
    optionA: 'a',
    optionB: 'b',
    optionC: 'c',
    optionD: 'd',
    correctOption: 'A',
    difficulty: 'easy',
    ...extra,
  }) as Question;

function renderModal(test: MockTest) {
  render(
    <AddQuestionsToTestModal
      test={test}
      isOpen
      onClose={vi.fn()}
      subjects={subjects}
      chapters={chapters}
      onQuestionsAssigned={vi.fn()}
    />
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('AddQuestionsToTestModal context', () => {
  it('defaults a PYQ test to PYQ-source questions from the test year', async () => {
    vi.spyOn(api, 'getTestAssignedQuestions').mockResolvedValue([]);
    const bank = vi
      .spyOn(api, 'getAllAdminQuestions')
      .mockResolvedValue([
        q('p1', { sourceType: 'pyq', sourceYear: 2021 }),
        q('p2', { sourceType: 'pyq', sourceYear: 2019 }),
      ]);
    renderModal({ ...base, id: 'pyq', title: 'PYQ', testType: 'pyq', examId: 'e1', year: 2021 });
    expect(await screen.findByText('Question p1')).toBeInTheDocument();
    expect(screen.queryByText('Question p2')).toBeNull();
    expect(bank).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 'pyq' }));
    expect(screen.getByLabelText('Question source')).toHaveValue('pyq');
    expect(screen.getByLabelText('Question year')).toHaveValue(2021);

    fireEvent.change(screen.getByLabelText('Question source'), { target: { value: 'all' } });
    fireEvent.change(screen.getByLabelText('Question year'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Apply Filter/ }));
    await waitFor(() =>
      expect(bank).toHaveBeenLastCalledWith(expect.objectContaining({ sourceType: undefined }))
    );
    expect(await screen.findByText('Question p2')).toBeInTheDocument();
  });

  it('locks Topic Test filters to its topic and blocks saving questions outside it', async () => {
    vi.spyOn(api, 'getTestAssignedQuestions').mockResolvedValue([
      {
        questionId: 'old',
        questionOrder: 1,
        marks: 2,
        negativeMarks: 0,
        chapterId: 't2',
        questionText: 'Old light question',
      },
      { questionId: 'h1', questionOrder: 2, marks: 1, negativeMarks: 0, chapterId: 't1' },
    ] as TestQuestionAssignment[]);
    const bank = vi
      .spyOn(api, 'getAllAdminQuestions')
      .mockResolvedValue([q('h1', { chapterId: 't1' }), q('h2', { chapterId: 't1' })]);
    const save = vi.spyOn(api, 'saveTestQuestions').mockResolvedValue({ success: true });
    renderModal({
      ...base,
      id: 'topic',
      title: 'Heat test',
      testType: 'topic',
      subjectId: 's1',
      chapterId: 't1',
    });

    expect(await screen.findByText('Question h2')).toBeInTheDocument();
    expect(bank).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: 's1', chapterId: 't1' })
    );
    expect(screen.getByLabelText('Subject filter')).toBeDisabled();
    expect(screen.getByLabelText('Topic filter')).toBeDisabled();

    expect(screen.getByRole('alert')).toHaveTextContent(
      "1 selected question is not under this test's topic (Heat)"
    );
    const saveBtn = screen.getByRole('button', { name: /Assign 2 Questions/ });
    expect(saveBtn).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Remove questions outside the topic' }));
    fireEvent.click(screen.getByText('Question h2'));
    fireEvent.click(screen.getByRole('button', { name: /Assign 2 Questions/ }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('topic', [
        { questionId: 'h1', orderIndex: 1, marks: 1, negativeMarks: 0.25 },
        { questionId: 'h2', orderIndex: 2, marks: 1, negativeMarks: 0.25 },
      ])
    );
  });
});
