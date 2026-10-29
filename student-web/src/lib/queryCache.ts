import type { QueryClient, QueryKey } from '@tanstack/react-query';

// Public catalog reads (exams, subjects, tests, banners, plans) are kept in IndexedDB, so a
// returning student does not download them again on every visit: that repeated download is
// what used up the Supabase egress quota. Anything tied to one student (profile, attempts,
// subscription, bookmarks, questions) stays in memory only and is always checked by the server.

/** Bump to drop every cached entry, e.g. after a catalog data shape changes. */
const CACHE_VERSION = 1;
const MAX_AGE_MS = 24 * 60 * 60_000;
/** A larger entry is not worth keeping on the device (and would point at inline images). */
const MAX_ENTRY_CHARS = 256 * 1024;

/** How long each cached catalog read stays fresh before it is fetched again in the background. */
const FRESH_FOR: Record<string, number> = {
  exams: 30 * 60_000,
  exam: 30 * 60_000,
  subjects: 30 * 60_000,
  topics: 30 * 60_000,
  'exam-tests': 30 * 60_000,
  'all-tests': 30 * 60_000,
  'topic-tests': 30 * 60_000,
  test: 30 * 60_000,
  plans: 30 * 60_000,
  'support-contact': 30 * 60_000,
  banners: 10 * 60_000,
  'live-tests': 5 * 60_000,
};

export const isPersistedQuery = (key: QueryKey): boolean => typeof key[0] === 'string' && key[0] in FRESH_FOR;

export interface CacheEntry {
  v: number;
  queryKey: QueryKey;
  data: unknown;
  updatedAt: number;
}

/** The few IndexedDB operations the cache needs (an in-memory store stands in for tests). */
export interface CacheStore {
  getAll(): Promise<{ id: string; entry: CacheEntry }[]>;
  put(id: string, entry: CacheEntry): Promise<void>;
  remove(id: string): Promise<void>;
}

const usable = (e: CacheEntry, now: number) =>
  e?.v === CACHE_VERSION && Array.isArray(e.queryKey) && isPersistedQuery(e.queryKey) && now - e.updatedAt < MAX_AGE_MS;

/** Longer fresh times (and memory lifetimes) for the cached catalog reads. */
export function applyCatalogDefaults(client: QueryClient): void {
  for (const [root, staleTime] of Object.entries(FRESH_FOR)) {
    client.setQueryDefaults([root], { staleTime, gcTime: Math.max(staleTime, 30 * 60_000) });
  }
}

/** Puts the saved catalog reads back into the query cache; expired or old-version entries are deleted. */
export async function restoreQueryCache(client: QueryClient, store: CacheStore, now = Date.now()): Promise<void> {
  const rows = await store.getAll();
  for (const { id, entry } of rows) {
    if (usable(entry, now)) client.setQueryData(entry.queryKey, entry.data, { updatedAt: entry.updatedAt });
    else await store.remove(id);
  }
}

/** Saves each successful catalog read; returns the unsubscribe function. */
export function persistQueryCache(client: QueryClient, store: CacheStore): () => void {
  return client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') return;
    const { queryKey, queryHash, state } = event.query;
    if (!isPersistedQuery(queryKey) || state.data === undefined) return;
    let size: number;
    try {
      size = JSON.stringify(state.data).length;
    } catch {
      return;
    }
    if (size > MAX_ENTRY_CHARS) {
      void store.remove(queryHash).catch(() => {});
      return;
    }
    void store
      .put(queryHash, { v: CACHE_VERSION, queryKey, data: state.data, updatedAt: state.dataUpdatedAt })
      .catch(() => {});
  });
}

const DB_NAME = 'pk-query-cache';
const STORE_NAME = 'queries';

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

/** IndexedDB-backed store, or null where IndexedDB is unavailable (some private windows). */
export async function openIndexedDbStore(): Promise<CacheStore | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE_NAME);
    const db = await request(open);
    const tx = (mode: IDBTransactionMode) => db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
    return {
      async getAll() {
        const store = tx('readonly');
        const [keys, values] = await Promise.all([request(store.getAllKeys()), request(store.getAll())]);
        return keys.map((k, i) => ({ id: String(k), entry: values[i] as CacheEntry }));
      },
      put: async (id, entry) => void (await request(tx('readwrite').put(entry, id))),
      remove: async (id) => void (await request(tx('readwrite').delete(id))),
    };
  } catch {
    return null;
  }
}

/**
 * Restores the saved catalog (waiting at most `timeoutMs`, so a slow disk never holds up the
 * first paint) and keeps saving it from then on.
 */
export async function setUpQueryCache(client: QueryClient, timeoutMs = 400): Promise<void> {
  applyCatalogDefaults(client);
  try {
    const store = await openIndexedDbStore();
    if (!store) return;
    await Promise.race([
      restoreQueryCache(client, store).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
    persistQueryCache(client, store);
  } catch {
    // The cache only saves downloads; the panel works the same without it.
  }
}
