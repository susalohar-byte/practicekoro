import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const from = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabaseRuntime: { rpc: (...a: unknown[]) => rpc(...a), from: (...a: unknown[]) => from(...a) },
  isSupabaseConfigured: true,
}));
const upload = vi.fn();
vi.mock('@/lib/rasterUploads', () => ({
  validateRasterFile: vi.fn(),
  uploadValidatedImage: (...a: unknown[]) => upload(...a),
}));

const { audioBookAdminApi, audioBookStudentApi } = await import('./audiobooks');

/** Minimal chainable PostgREST stub resolving to `result`. */
function query(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'in', 'or', 'order', 'range', 'insert', 'update', 'delete'])
    chain[m] = () => chain;
  chain.single = () => Promise.resolve(result);
  chain.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

describe('audiobooks service: database is the only source of truth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns stats computed by the database, with zero listens when none are tracked', async () => {
    rpc.mockResolvedValue({
      data: {
        total: 0,
        published: 0,
        drafts: 0,
        total_duration_seconds: 0,
        timed_count: 0,
        total_listens: 0,
      },
      error: null,
    });
    await expect(audioBookAdminApi.getStats()).resolves.toEqual({
      total: 0,
      published: 0,
      drafts: 0,
      totalDurationSeconds: 0,
      timedCount: 0,
      totalListens: 0,
    });
  });

  it('surfaces stats errors instead of fabricating numbers', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } });
    await expect(audioBookAdminApi.getStats()).rejects.toThrow(/permission/);
  });

  it('returns an empty list when the database has no books (no seed data)', async () => {
    from.mockReturnValue(query({ data: [], error: null, count: 0 }));
    await expect(
      audioBookAdminApi.list({ page: 1, pageSize: 8 }, { categories: [], subjects: [], topics: [] })
    ).resolves.toEqual({ items: [], total: 0 });
    from.mockReturnValue(query({ data: [], error: null }));
    await expect(audioBookStudentApi.listPublished()).resolves.toEqual([]);
    await expect(audioBookStudentApi.getTaxonomy()).resolves.toEqual({
      categories: [],
      subjects: [],
      topics: [],
    });
  });

  it('rejects a failed save rather than pretending it succeeded', async () => {
    from.mockReturnValue(query({ data: null, error: { code: '23514', message: 'check' } }));
    await expect(
      audioBookAdminApi.create({
        title: 'X',
        description: null,
        narrator: null,
        categoryId: 'c',
        subjectId: 's',
        topicId: null,
        thumbnailUrl: null,
        youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
        youtubeVideoId: 'dQw4w9WgXcQ',
        durationSeconds: null,
        status: 'draft',
      })
    ).rejects.toThrow(/invalid/);
    expect(localStorage.length).toBe(0);
  });

  it('never returns a local blob URL when a thumbnail upload fails', async () => {
    upload.mockRejectedValue(new Error('Durable image upload failed.'));
    const file = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });
    await expect(audioBookAdminApi.uploadThumbnail(file)).rejects.toThrow(/upload failed/);
  });

  it('requires a confirmed row for deletes', async () => {
    from.mockReturnValue(query({ data: [], error: null }));
    await expect(audioBookAdminApi.delete('missing')).rejects.toThrow(/not confirmed/);
  });
});
