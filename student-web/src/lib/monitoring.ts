/**
 * Error monitoring (Sentry). Off unless VITE_SENTRY_DSN is set at build time,
 * so local, demo and test builds never report anything. The SDK is loaded
 * lazily and stays out of the main bundle.
 *
 * Privacy: no personal data is sent (sendDefaultPii off, no session replay,
 * no performance tracing); only the error, its stack and the page path.
 */
type SentryModule = typeof import('@sentry/react');

let sentry: SentryModule | null = null;

export async function initMonitoring(app: string): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || sentry) return;
  try {
    const mod = await import('@sentry/react');
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      initialScope: { tags: { app } },
      // A new deployment replacing chunks is handled by an automatic reload.
      ignoreErrors: [/Failed to fetch dynamically imported module/, /Loading chunk \d+ failed/],
    });
    sentry = mod;
  } catch {
    // Monitoring must never break the app.
  }
}

/** Reports an error caught by the app (e.g. an error boundary). No-op when monitoring is off. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  sentry?.captureException(error, context ? { extra: context } : undefined);
}
