import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastHost } from '@/components/common/ToastHost';
import { inferToastKind, toast } from './toast';

afterEach(() => vi.restoreAllMocks());

describe('toast', () => {
  it('reads failures as errors and confirmations as successes', () => {
    expect(inferToastKind('Failed to save changes: network down')).toBe('error');
    expect(inferToastKind('You do not have permission to delete mock tests.')).toBe('error');
    expect(inferToastKind('Mock test duplicated successfully!')).toBe('success');
    expect(inferToastKind('No test attempts to export.')).toBe('info');
  });

  it('shows the message in the host instead of a browser alert', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ToastHost />);
    act(() => toast('Failed to save changes'));
    expect(screen.getByRole('alert').textContent).toContain('Failed to save changes');
    act(() => toast('Mock test restored as a draft.'));
    expect(screen.getByRole('status').textContent).toContain('restored');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('falls back to a browser alert when no host is mounted', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    toast('Something happened');
    expect(alertSpy).toHaveBeenCalledWith('Something happened');
  });
});
