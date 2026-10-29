import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { reportError } from '@/lib/monitoring';
import {
  isChunkLoadError,
  clearChunkReloadGuard,
  CHUNK_RELOAD_KEY as RELOAD_GUARD_KEY,
} from '@/utils/lazyWithRetry';

export { isChunkLoadError };

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback; when omitted the built-in bilingual panel is used. */
  fallback?: React.ReactNode;
  /** Called after the user taps "Try again" so callers can reset local state. */
  onReset?: () => void;
  /** Short label describing the crashed area, e.g. "student dashboard". */
  area?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors in its subtree so a single broken screen can no
 * longer blank the whole application. Rate-limited chunk reloads make stale
 * deployments self-healing without trapping the user in a reload loop.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidMount() {
    if (!this.state.error) {
      clearChunkReloadGuard();
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
    if (!isChunkLoadError(error)) {
      reportError(error, { area: this.props.area, componentStack: info.componentStack });
    }

    if (isChunkLoadError(error) && typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem(RELOAD_GUARD_KEY) !== 'true') {
          sessionStorage.setItem(RELOAD_GUARD_KEY, 'true');
          window.location.reload();
        }
      } catch {
        // sessionStorage unavailable (private mode); fall through to the panel
      }
    }
  }

  handleRetry = () => {
    clearChunkReloadGuard();
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center space-y-4 shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isChunkLoadError(error) ? 'New Update Available' : 'Something went wrong'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isChunkLoadError(error)
                ? 'PracticeKoro was recently updated or your network connection was interrupted. Please reload to fetch the latest version.'
                : `An unexpected error occurred${this.props.area ? ` in the ${this.props.area}` : ''}. Your saved progress and attempts are safe.`}
            </p>
          </div>

          <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 break-words">
            {error.message}
          </p>

          <div className="flex items-center justify-center gap-2 pt-1">
            <Button
              size="sm"
              className="font-bold"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={this.handleRetry}
            >
              Try Again
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  sessionStorage.removeItem(RELOAD_GUARD_KEY);
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
            >
              Reload
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
