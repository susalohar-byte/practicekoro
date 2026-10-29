import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  applyCatalogDefaults,
  isPersistedQuery,
  persistQueryCache,
  restoreQueryCache,
  type CacheEntry,
  type CacheStore,
} from './queryCache';

function memoryStore(seed: Record<string, CacheEntry> = {}) {
  const rows = new Map(Object.entries(seed));
  const store: CacheStore = {
    getAll: async () => [...rows].map(([id, entry]) => ({ id, entry })),
    put: async (id, entry) => void rows.set(id, entry),
    remove: async (id) => void rows.delete(id),
  };
  return { rows, store };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('query cache', () => {
  it('keeps only public catalog reads', () => {
    expect(isPersistedQuery(['exams'])).toBe(true);
    expect(isPersistedQuery(['exam-tests', 'e1'])).toBe(true);
    for (const key of ['profile', 'subscription', 'attempt-history', 'solutions', 'bookmarks', 'runner-questions'])
      expect(isPersistedQuery([key, 'u1'])).toBe(false);
  });

  it('restores fresh entries and deletes expired or old-version ones', async () => {
    const now = Date.now();
    const { rows, store } = memoryStore({
      a: { v: 1, queryKey: ['exams'], data: ['WBP'], updatedAt: now - 60_000 },
      b: { v: 1, queryKey: ['subjects'], data: ['Math'], updatedAt: now - 25 * 60 * 60_000 },
      c: { v: 0, queryKey: ['plans'], data: ['Pro'], updatedAt: now },
      d: { v: 1, queryKey: ['profile', 'u1'], data: { name: 'x' }, updatedAt: now },
    });
    const client = new QueryClient();
    await restoreQueryCache(client, store, now);
    expect(client.getQueryData(['exams'])).toEqual(['WBP']);
    expect(client.getQueryState(['exams'])?.dataUpdatedAt).toBe(now - 60_000);
    expect(client.getQueryData(['subjects'])).toBeUndefined();
    expect([...rows.keys()]).toEqual(['a']);
  });

  it('saves successful catalog fetches but never student data or oversized entries', async () => {
    const { rows, store } = memoryStore();
    const client = new QueryClient();
    persistQueryCache(client, store);
    await client.fetchQuery({ queryKey: ['exams'], queryFn: async () => ['WBP'] });
    await client.fetchQuery({ queryKey: ['subscription', 'u1'], queryFn: async () => ({ active: true }) });
    await client.fetchQuery({ queryKey: ['banners'], queryFn: async () => ['x'.repeat(300 * 1024)] });
    await flush();
    expect([...rows.values()].map((e) => e.queryKey)).toEqual([['exams']]);
  });

  it('keeps cached catalog reads fresh for longer than the panel default', () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
    applyCatalogDefaults(client);
    expect(client.getQueryDefaults(['exams']).staleTime).toBe(30 * 60_000);
    expect(client.getQueryDefaults(['live-tests']).staleTime).toBe(5 * 60_000);
  });
});
