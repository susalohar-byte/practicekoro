import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Question } from '@/types';

const mocks = vi.hoisted(() => ({
  createQuestion: vi.fn(),
  getAllAdminTests: vi.fn(),
  addQuestionToTest: vi.fn(),
}));

vi.mock('@/services/api', () => ({ api: mocks }));

import { useQuestionImport } from './useQuestionImport';

const TXT = '1. Capital of India?\n(a) Delhi\n(b) Mumbai\n(c) Pune\n(d) Agra\nAnswer: (a)';

const exams = [
  { id: 'e1', title: 'WBP Constable' },
  { id: 'e2', title: 'WBPSC Clerkship' },
];

function setup(listFilters: { exam?: string; subject?: string; topic?: string } = {}) {
  return renderHook(() =>
    useQuestionImport({
      subjects: [{ id: 's1', name: 'History' } as never],
      topics: [{ id: 't1', name: 'Mughal', subjectId: 's1' } as never],
      exams,
      selectedExamFilter: listFilters.exam ?? 'all',
      selectedSubjectFilter: listFilters.subject ?? 'all',
      selectedTopicFilter: listFilters.topic ?? 'all',
      setQuestions: vi.fn(),
      showToast: vi.fn(),
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAllAdminTests.mockResolvedValue([]);
  mocks.createQuestion.mockImplementation(async (q: Question) => q);
});

describe('useQuestionImport', () => {
  it('saves pasted questions under the exam chosen in the import box, not the list filter', async () => {
    const { result } = setup({ exam: 'WBP Constable' });

    act(() => result.current.setIsImportModalOpen(true));
    // The box starts from the list filter...
    await waitFor(() => expect(result.current.importExam).toBe('WBP Constable'));
    // ...and the user picks another exam after the preview
    act(() => result.current.setImportPasteText(TXT));
    act(() => result.current.handlePreviewPastedQuestions());
    await waitFor(() => expect(result.current.importPreviewStats?.valid).toBe(1));
    act(() => result.current.setImportExam('WBPSC Clerkship'));

    await act(() => result.current.handleExecuteImport());
    expect(mocks.createQuestion).toHaveBeenCalledWith(
      expect.objectContaining({ sourceExam: 'WBPSC Clerkship' })
    );
  });

  it('clears the preview when the upload mode changes', async () => {
    const { result } = setup();
    act(() => result.current.setImportPasteText(TXT));
    act(() => result.current.handlePreviewPastedQuestions());
    await waitFor(() => expect(result.current.importPreviewStats?.valid).toBe(1));

    act(() => result.current.setImportMode('subject'));
    expect(result.current.importPreviewStats).toBeNull();
  });

  it('puts pasted By Subject questions into the subject and topic chosen in the box', async () => {
    const { result } = setup({ subject: 'History', topic: 'Mughal' });
    act(() => result.current.setImportMode('subject'));
    act(() => result.current.setIsImportModalOpen(true));
    await waitFor(() => expect(result.current.importSubjectId).toBe('s1'));
    expect(result.current.importTopicId).toBe('t1');

    act(() => result.current.setImportPasteText(TXT));
    act(() => result.current.handlePreviewPastedQuestions());
    await waitFor(() => expect(result.current.importPreviewStats?.valid).toBe(1));

    await act(() => result.current.handleExecuteImport());
    expect(mocks.createQuestion).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: 's1', topicId: 't1', chapterId: 't1' })
    );
  });
});
