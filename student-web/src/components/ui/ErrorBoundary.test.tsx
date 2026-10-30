import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const reportError = vi.fn();
vi.mock('@/lib/monitoring', () => ({ reportError: (...args: unknown[]) => reportError(...args) }));

import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('fine')).toBeTruthy();
  });

  it('shows the retry panel and reports the error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
      expect.any(Object)
    );
  });
});
