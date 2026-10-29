import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  data: null as unknown,
  error: null as string | null,
  calls: [] as { fn: string; args: any }[],
  fromCalls: [] as string[],
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    rpc: async (fn: string, args: any) => {
      m.calls.push({ fn, args });
      return m.error ? { data: null, error: { message: m.error } } : { data: m.data, error: null };
    },
    from: (table: string) => {
      m.fromCalls.push(table);
      throw new Error(`unexpected table read: ${table}`);
    },
  },
}));
import { fetchPostSummaries, fetchPublishedPost, pickHomepagePosts } from './publicBlog';

const card = (id: string, isFeatured = false) => ({
  id,
  slug: `post-${id}`,
  title: `Post ${id}`,
  isFeatured,
  createdAt: '2026-10-01T00:00:00.000Z',
});

beforeEach(() => {
  m.data = null;
  m.error = null;
  m.calls = [];
  m.fromCalls = [];
});

describe('public blog reads', () => {
  it('lists cards through public_blog_summaries, never the whole blog_posts_list row', async () => {
    m.data = [card('1'), card('2')];
    expect((await fetchPostSummaries()).map((p) => p.id)).toEqual(['1', '2']);
    expect(m.calls).toEqual([
      { fn: 'public_blog_summaries', args: { p_limit: null, p_featured_first: false } },
    ]);
    expect(m.fromCalls).toEqual([]);
  });

  it('asks for featured-first homepage cards with a limit', async () => {
    m.data = [card('1', true), card('2'), card('3'), card('4')];
    const posts = await fetchPostSummaries({ limit: 4, featuredFirst: true });
    expect(m.calls[0].args).toEqual({ p_limit: 4, p_featured_first: true });
    // The landing section shows three and knows there are more.
    expect(pickHomepagePosts(posts).map((p) => p.id)).toEqual(['1', '2', '3']);
    expect(posts.length).toBeGreaterThan(pickHomepagePosts(posts).length);
  });

  it('treats a non-array response as no posts and surfaces errors', async () => {
    m.data = null;
    expect(await fetchPostSummaries()).toEqual([]);
    m.error = 'boom';
    await expect(fetchPostSummaries()).rejects.toThrow('boom');
  });

  it('loads one article by slug through public_blog_post', async () => {
    m.data = { ...card('7'), content: '<p>Body</p>' };
    const post = await fetchPublishedPost('post-7');
    expect(m.calls).toEqual([{ fn: 'public_blog_post', args: { p_slug: 'post-7' } }]);
    expect(post?.content).toBe('<p>Body</p>');
  });

  it('returns null for an unknown slug without inventing a post', async () => {
    m.data = null;
    expect(await fetchPublishedPost('missing')).toBeNull();
    expect(await fetchPublishedPost('')).toBeNull();
    expect(m.calls).toHaveLength(1);
  });

  it('keeps featured posts first on the landing page', () => {
    const picked = pickHomepagePosts([card('a'), card('b', true), card('c'), card('d', true)]);
    expect(picked.map((p) => p.id)).toEqual(['b', 'd', 'a']);
  });
});
