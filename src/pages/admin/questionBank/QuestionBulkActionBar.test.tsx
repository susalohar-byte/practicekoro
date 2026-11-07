import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestionBulkActionBar } from './QuestionBulkActionBar';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

describe('QuestionBulkActionBar add to test', () => {
  it('adds the selected questions to the test picked in the bar', async () => {
    const linkQuestionsToTest = vi.fn().mockResolvedValue(undefined);
    const qb = {
      selectedRowIds: new Set(['q1', 'q2']),
      filteredTotal: 2,
      allFilteredSelected: true,
      isSelectingAll: false,
      selectAllFiltered: vi.fn(),
      handleBulkStatusChange: vi.fn(),
      handleExportSelectedCSV: vi.fn(),
      handleBulkDelete: vi.fn(),
      setSelectedRowIds: vi.fn(),
      filterTestOptions: [{ id: 't1', title: 'WBPSC Full Mock 1' }],
      linkQuestionsToTest,
    } as unknown as AdminQuestionBankState;

    render(<QuestionBulkActionBar qb={qb} />);
    const button = screen.getByRole('button', { name: 'Add 2 to test' });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Test to add selected questions to'), {
      target: { value: 't1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add 2 to test' }));
    expect(linkQuestionsToTest).toHaveBeenCalledWith('t1', ['q1', 'q2']);
  });
});
