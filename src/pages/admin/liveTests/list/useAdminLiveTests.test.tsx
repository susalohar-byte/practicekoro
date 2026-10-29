import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { api } from '@/services/api';
import { LIVE_TESTS_REFRESH_DEBOUNCE_MS, useAdminLiveTests } from './useAdminLiveTests';

const realtime = vi.hoisted(() => ({ notify: null as null | (() => void) }));

vi.mock('@/services/api', () => ({
  api: {
    getLiveTests: vi.fn(),
    getAllAdminExams: vi.fn(),
    getLiveTestsStats: vi.fn(),
    subscribeToLiveTestUpdates: vi.fn((cb: () => void) => {
      realtime.notify = cb;
      return () => {
        realtime.notify = null;
      };
    }),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(api.getLiveTests).mockResolvedValue([]);
  vi.mocked(api.getAllAdminExams).mockResolvedValue([]);
  vi.mocked(api.getLiveTestsStats).mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAdminLiveTests realtime refresh', () => {
  it('coalesces a burst of update signals into one refetch', async () => {
    const { unmount } = renderHook(() => useAdminLiveTests(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(api.getLiveTests).toHaveBeenCalledTimes(1); // initial load

    // A single save emits a local event, a broadcast and an app_settings change.
    act(() => {
      realtime.notify?.();
      realtime.notify?.();
      realtime.notify?.();
    });
    expect(api.getLiveTests).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(LIVE_TESTS_REFRESH_DEBOUNCE_MS);
      await Promise.resolve();
    });
    expect(api.getLiveTests).toHaveBeenCalledTimes(2);

    // A signal pending at unmount never fires a request.
    act(() => realtime.notify?.());
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(LIVE_TESTS_REFRESH_DEBOUNCE_MS * 2);
    });
    expect(api.getLiveTests).toHaveBeenCalledTimes(2);
  });
});
