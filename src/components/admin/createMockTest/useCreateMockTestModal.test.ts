import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type React from 'react';
import type { MockTestType } from './useCreateMockTestModal';

const mocks = vi.hoisted(() => ({ createTest: vi.fn() }));
vi.mock('@/services/api', () => ({ api: mocks }));

import { useCreateMockTestModal } from './useCreateMockTestModal';

const exams = [{ id: 'wbcs', title: 'WBCS', category: 'State' }] as never[];
const submitEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

function setup(initialType: MockTestType) {
  return renderHook(() =>
    useCreateMockTestModal({
      isOpen: true,
      onClose: vi.fn(),
      exams,
      subjects: [],
      chapters: [],
      onTestCreated: vi.fn(),
      initialType,
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createTest.mockImplementation(async (t: unknown) => t);
});

describe('useCreateMockTestModal Prelims / Mains', () => {
  it('saves no paper by default (single-paper exams)', async () => {
    const { result } = setup('full_mock');
    await waitFor(() => expect(result.current.examId).toBe('wbcs'));
    expect(result.current.stage).toBeNull();
    act(() => result.current.setTitle('WBCS Full Mock 1'));
    await act(() => result.current.handleSubmit(submitEvent));
    expect(mocks.createTest).toHaveBeenCalledWith(
      expect.objectContaining({ testType: 'full_mock', paperName: undefined, stage: null })
    );
  });

  it('saves the chosen paper on a Full Mock and toggles it off on a second click', async () => {
    const { result } = setup('full_mock');
    await waitFor(() => expect(result.current.examId).toBe('wbcs'));
    act(() => result.current.setStage('Mains'));
    act(() => result.current.handleAutoSuggestTitle());
    expect(result.current.title).toBe('WBCS Mains Full Mock Test 01');
    await act(() => result.current.handleSubmit(submitEvent));
    expect(mocks.createTest).toHaveBeenCalledWith(
      expect.objectContaining({ paperName: 'Mains', stage: 'Mains' })
    );

    act(() => result.current.setStage(null));
    expect(result.current.stage).toBeNull();
  });

  it('joins the paper and shift on a PYQ', async () => {
    const { result } = setup('pyq');
    await waitFor(() => expect(result.current.examId).toBe('wbcs'));
    act(() => result.current.setStage('Prelims'));
    act(() => result.current.setPaperName(' Shift 1 '));
    act(() => result.current.setYear(2023));
    act(() => result.current.handleAutoSuggestTitle());
    expect(result.current.title).toBe('WBCS 2023 Prelims Shift 1 Official PYQ');
    await act(() => result.current.handleSubmit(submitEvent));
    expect(mocks.createTest).toHaveBeenCalledWith(
      expect.objectContaining({ testType: 'pyq', paperName: 'Prelims Shift 1', stage: 'Prelims' })
    );
  });
});
