import { act, renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useQuestionBulkActions } from './useQuestionBulkActions';

const checkboxEvent = (checked: boolean) =>
  ({ target: { checked } }) as React.ChangeEvent<HTMLInputElement>;

function setup(getFilteredQuestionIds: () => Promise<string[]>, filteredTotal = 3) {
  const showToast = vi.fn();
  const hook = renderHook(() =>
    useQuestionBulkActions({
      questions: [],
      setQuestions: vi.fn(),
      filteredTotal,
      getFilteredQuestionIds,
      setActiveQuestion: vi.fn(),
      showToast,
    })
  );
  return { ...hook, showToast };
}

describe('useQuestionBulkActions select all', () => {
  it('header checkbox selects every filtered question across pages', async () => {
    const getIds = vi.fn().mockResolvedValue(['q1', 'q2', 'q3']);
    const { result } = setup(getIds);

    act(() => result.current.handleSelectAll(checkboxEvent(true)));

    await waitFor(() => expect(result.current.selectedRowIds.size).toBe(3));
    expect(getIds).toHaveBeenCalledTimes(1);
    expect(result.current.allFilteredSelected).toBe(true);
    expect(result.current.isSelectingAll).toBe(false);
  });

  it('unchecking clears the selection', async () => {
    const { result } = setup(vi.fn().mockResolvedValue(['q1', 'q2', 'q3']));
    await act(() => result.current.selectAllFiltered());

    act(() => result.current.handleSelectAll(checkboxEvent(false)));

    expect(result.current.selectedRowIds.size).toBe(0);
    expect(result.current.allFilteredSelected).toBe(false);
  });

  it('keeps the selection and reports an error when ids cannot be loaded', async () => {
    const { result, showToast } = setup(vi.fn().mockRejectedValue(new Error('network down')));

    await act(() => result.current.selectAllFiltered());

    expect(result.current.selectedRowIds.size).toBe(0);
    expect(result.current.isSelectingAll).toBe(false);
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('network down'));
  });
});
