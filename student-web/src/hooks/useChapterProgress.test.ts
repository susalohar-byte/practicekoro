import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const q = vi.hoisted(() => ({
  tests: { data: undefined as unknown, isLoading: false },
  history: { data: undefined as unknown, isLoading: false },
}));

vi.mock('./queries', () => ({
  useAllTests: () => q.tests,
  useAttemptHistory: () => q.history,
}));

import { isChapterDone, isChapterWeak, useChapterProgress } from './useChapterProgress';

beforeEach(() => {
  q.tests = { data: undefined, isLoading: false };
  q.history = { data: undefined, isLoading: false };
});

describe('useChapterProgress', () => {
  it('counts each chapter test once and pools accuracy across attempts', () => {
    q.tests.data = [
      { id: 't1', chapterId: 'c1' },
      { id: 't2', chapterId: 'c1' },
      { id: 't3', chapterId: 'c2' },
      { id: 'full', chapterId: null },
    ];
    q.history.data = [
      { testId: 't1', correctCount: 8, wrongCount: 2 },
      { testId: 't1', correctCount: 6, wrongCount: 4 },
      { testId: 'full', correctCount: 50, wrongCount: 0 },
      { testId: 'unknown', correctCount: 1, wrongCount: 1 },
    ];
    const { result } = renderHook(() => useChapterProgress());
    expect(result.current.map.get('c1')).toEqual({ completed: 1, total: 2, accuracy: 0.7 });
    expect(result.current.map.get('c2')).toEqual({ completed: 0, total: 1, accuracy: null });
    expect(result.current.map.has('full')).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns an empty map with loading state while data is pending', () => {
    q.tests.isLoading = true;
    const { result } = renderHook(() => useChapterProgress());
    expect(result.current.map.size).toBe(0);
    expect(result.current.isLoading).toBe(true);
  });

  it('marks a chapter done only when every test was completed', () => {
    expect(isChapterDone({ completed: 2, total: 2, accuracy: 1 })).toBe(true);
    expect(isChapterDone({ completed: 1, total: 2, accuracy: 1 })).toBe(false);
    expect(isChapterDone({ completed: 0, total: 0, accuracy: null })).toBe(false);
    expect(isChapterDone(undefined)).toBe(false);
  });

  it('marks a chapter weak when attempted accuracy is under 50%', () => {
    expect(isChapterWeak({ completed: 1, total: 2, accuracy: 0.49 })).toBe(true);
    expect(isChapterWeak({ completed: 1, total: 2, accuracy: 0.5 })).toBe(false);
    expect(isChapterWeak({ completed: 0, total: 2, accuracy: null })).toBe(false);
    expect(isChapterWeak(undefined)).toBe(false);
  });
});
