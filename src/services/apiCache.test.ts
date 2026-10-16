import { describe, expect, it, vi } from 'vitest';
import { invalidateApiCache, withApiCache } from './apiCache';

describe('apiCache', () => {
  it('serves a fresh entry without refetching', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a']);
    await withApiCache('k', fetcher);
    expect(await withApiCache('k', fetcher)).toEqual(['a']);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('denied')).mockResolvedValue(['ok']);
    await expect(withApiCache('k', fetcher)).rejects.toThrow('denied');
    expect(await withApiCache('k', fetcher)).toEqual(['ok']);
  });

  it('drops a response that started before an invalidation (e.g. sign-out mid-request)', async () => {
    let resolve!: (v: string[]) => void;
    const inFlight = withApiCache('dashboard', () => new Promise<string[]>((r) => (resolve = r)));
    invalidateApiCache(); // account A signs out while A's request is pending
    resolve(['account A data']);
    expect(await inFlight).toEqual(['account A data']); // the original caller still gets its result
    const next = vi.fn().mockResolvedValue(['account B data']);
    expect(await withApiCache('dashboard', next)).toEqual(['account B data']);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
