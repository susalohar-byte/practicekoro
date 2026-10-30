/**
 * PracticeKoro High-Performance In-Memory API Cache
 *
 * Provides instant 0ms responses on repeated page transitions,
 * eliminating unnecessary re-fetches and skeleton flickering.
 * Cache is automatically invalidated during mutations or can be explicitly cleared.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
// Bumped on every invalidation so a request that started before it cannot repopulate the cache.
let generation = 0;

export function getCached<T>(key: string, ttlMs = 60_000): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    memoryCache.delete(key);
    return null;
  }
  // Each key is only ever written by the caller that reads it, so the stored type is T.
  return entry.data as T;
}

export function setCached<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateApiCache(prefix?: string): void {
  generation += 1;
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Executes fetcher with in-memory caching.
 * If data is already cached and fresh within ttlMs, returns immediately without network request.
 */
export async function withApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 60_000
): Promise<T> {
  const cached = getCached<T>(key, ttlMs);
  if (cached !== null) {
    return cached;
  }
  const startedAt = generation;
  const fresh = await fetcher();
  if (startedAt === generation) setCached(key, fresh);
  return fresh;
}
