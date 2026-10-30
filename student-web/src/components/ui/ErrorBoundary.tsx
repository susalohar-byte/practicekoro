import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '@/lib/monitoring';
import { ErrorState } from './Feedback';

/**
 * Catches render errors so one broken screen shows a retry panel instead of a
 * blank page, and reports them to monitoring. Retry reloads the page, which
 * also picks up fresh chunks after a deployment.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <ErrorState
          message="This page could not be shown. Your saved progress is safe."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
}
