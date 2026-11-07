import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestionImportModal } from './QuestionImportModal';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

function makeQb(overrides: Record<string, unknown> = {}) {
  const qb = {
    isImportModalOpen: true,
    setIsImportModalOpen: vi.fn(),
    setIsLiveUploadOpen: vi.fn(),
    setImportMode: vi.fn(),
    importMode: 'exam',
    exams: [{ id: 'e1', title: 'WBPSC Clerkship' }],
    importExam: 'WBPSC Clerkship',
    setImportExam: vi.fn(),
    importPasteText: '',
    setImportPasteText: vi.fn(),
    handlePreviewPastedQuestions: vi.fn(),
    importNeedsExam: false,
    subjects: [],
    importSubjectId: '',
    setImportSubjectId: vi.fn(),
    importTopicId: '',
    setImportTopicId: vi.fn(),
    importTopicOptions: [],
    importNeedsTopic: false,
    importTestType: 'full_mock',
    setImportTestType: vi.fn(),
    importTestId: '',
    setImportTestId: vi.fn(),
    importTests: [
      { id: 't1', title: 'WBPSC Clerkship Full Mock 1', totalQuestions: 100 },
      { id: 't2', title: 'WBPSC PYQ 2023', totalQuestions: 0 },
    ],
    isLoadingImportTests: false,
    downloadTemplate: vi.fn(),
    importFile: null,
    processImportFile: vi.fn(),
    handleClearImportFile: vi.fn(),
    importPreviewStats: null,
    isImporting: false,
    handleExecuteImport: vi.fn(),
    ...overrides,
  };
  return qb as unknown as AdminQuestionBankState;
}

describe('QuestionImportModal mock test picker', () => {
  it('lists the exam tests and reports the chosen test back', () => {
    const qb = makeQb();
    render(<QuestionImportModal qb={qb} />);

    const select = screen.getByLabelText('Mock test') as HTMLSelectElement;
    expect(select.disabled).toBe(false);
    expect(screen.getByRole('option', { name: /Full Mock 1 \(100 Q\)/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'WBPSC PYQ 2023' })).toBeTruthy();

    fireEvent.change(select, { target: { value: 't2' } });
    expect(qb.setImportTestId).toHaveBeenCalledWith('t2');
  });

  it('switches between Full Mock and PYQ test types', () => {
    const qb = makeQb();
    render(<QuestionImportModal qb={qb} />);
    fireEvent.click(screen.getByRole('button', { name: 'PYQ' }));
    expect(qb.setImportTestType).toHaveBeenCalledWith('pyq');
  });

  it('keeps the test picker disabled until an exam is chosen', () => {
    render(<QuestionImportModal qb={makeQb({ importExam: '', importTests: [] })} />);
    const select = screen.getByLabelText('Mock test') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    expect(screen.getByRole('option', { name: 'Select an exam first' })).toBeTruthy();
  });

  it('is not shown for By Subject uploads', () => {
    render(<QuestionImportModal qb={makeQb({ importMode: 'subject' })} />);
    expect(screen.queryByLabelText('Mock test')).toBeNull();
    expect(screen.getByLabelText('Subject')).toBeTruthy();
  });
});
