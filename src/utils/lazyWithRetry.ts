import React from 'react';

export const CHUNK_RELOAD_KEY = 'practicekoro_chunk_reload_attempted';

/**
 * Detects the class of errors that occur when a lazily-loaded route chunk is
 * no longer available on the server (typically after a new deployment replaced
 * content-hashed asset filenames).
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : String(error);

  if (!message) return false;

  return (
    /failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message) ||
    /loading chunk \d+ failed/i.test(message) ||
    /loading css chunk \d+ failed/i.test(message) ||
    /failed to load module script/i.test(message) ||
    /error resolving module specifier/i.test(message)
  );
}

/**
 * Resets the reload guard so subsequent deployments in the same user session
 * can also trigger auto-reloads.
 */
export function clearChunkReloadGuard(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    /* ignore session storage errors (e.g. private browsing) */
  }
}

/**
 * Wraps dynamic component imports with automated self-healing retry logic.
 *
 * When a new deployment is shipped to production, old chunk hashes on the server
 * are superseded by new ones. If a user is on an existing tab with an older bundle,
 * navigating to a lazy route throws a "Failed to fetch dynamically imported module" error.
 *
 * This wrapper intercepts that chunk load error, checks a sessionStorage guard to
 * prevent infinite reload loops, and reloads the window to pull down the fresh index.html
 * and latest chunk manifests. Upon any successful module load, the guard is cleared.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors React.lazy's own `ComponentType<any>` bound; narrower bounds reject components with props
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const module = await factory();
      clearChunkReloadGuard();
      return module;
    } catch (error) {
      if (isChunkLoadError(error) && typeof window !== 'undefined') {
        let hasReloaded = false;
        try {
          hasReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === 'true';
        } catch {
          /* ignore */
        }

        if (!hasReloaded) {
          try {
            sessionStorage.setItem(CHUNK_RELOAD_KEY, 'true');
          } catch {
            /* ignore */
          }

          console.warn(
            '[PracticeKoro] New deployment detected; auto-reloading page to fetch latest bundle...'
          );

          // Force reload to fetch fresh index.html and asset manifest
          window.location.reload();

          // Return a hanging promise to allow browser to reload without flashing error UI
          return new Promise<never>(() => {});
        }
      }

      throw error;
    }
  });
}
