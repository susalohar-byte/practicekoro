import { beforeEach, describe, expect, it, vi } from 'vitest';

// Banners, blog posts and Popular Exam cards are read from their own tables (explicit
// columns), never from app_settings list rows.
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  calls: [] as { table: string; ops: [string, unknown[]][] }[],
  rows: {} as Record<string, unknown[]>,
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {},
  supabaseRuntime: { from: mocks.from, rpc: mocks.rpc },
}));

import { bannerService } from './bannerService';
import { adminBlogApi } from './domains/admin.blog';
import { getPopularExams, savePopularExams } from './domains/admin.exams';

const tables = () => mocks.calls.map((c) => c.table);
const selectOf = (table: string) =>
  mocks.calls.find((c) => c.table === table)?.ops.find(([op]) => op === 'select')?.[1][0];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.calls = [];
  mocks.rows = {};
  mocks.rpc.mockResolvedValue({ data: { success: true, count: 1 }, error: null });
  mocks.from.mockImplementation((table: string) => {
    const call = { table, ops: [] as [string, unknown[]][] };
    mocks.calls.push(call);
    const q: any = {};
    for (const k of ['select', 'order', 'eq', 'neq', 'in', 'limit']) {
      q[k] = vi.fn((...args: unknown[]) => {
        call.ops.push([k, args]);
        return q;
      });
    }
    q.then = (resolve: any) =>
      Promise.resolve({ data: mocks.rows[table] ?? [], error: null }).then(resolve);
    return q;
  });
});

describe('content tables', () => {
  it('reads hero banners from hero_banners and maps them to the admin shape', async () => {
    mocks.rows.hero_banners = [
      {
        id: 'b2',
        title: 'Second',
        image_url: 'https://cdn/b.webp',
        banner_type: 'text_overlay',
        show_text_overlay: true,
        feature_pills: ['A'],
        is_active: true,
        display_order: 2,
        created_at: '2026-10-01T00:00:00.000Z',
      },
    ];
    const [banner] = await bannerService.getBanners();
    expect(tables()).toEqual(['hero_banners']);
    expect(selectOf('hero_banners')).not.toContain('*');
    expect(banner).toMatchObject({
      id: 'b2',
      title: 'Second',
      imageUrl: 'https://cdn/b.webp',
      bannerType: 'text_overlay',
      showTextOverlay: true,
      featurePills: ['A'],
      isActive: true,
      displayOrder: 2,
    });
  });

  it('reads blog posts from blog_posts in list order', async () => {
    mocks.rows.blog_posts = [
      {
        id: 'p1',
        title: 'Post',
        slug: 'post',
        status: 'published',
        is_featured: true,
        unique_views: 4,
        published_at: '2026-10-01T00:00:00.000Z',
        tags: ['x'],
      },
    ];
    const [post] = await adminBlogApi.getAllBlogPosts();
    expect(tables()).toEqual(['blog_posts']);
    expect(selectOf('blog_posts')).not.toContain('*');
    expect(mocks.calls[0].ops).toContainEqual(['order', ['seq', { ascending: true }]]);
    expect(post).toMatchObject({
      id: 'p1',
      slug: 'post',
      isFeatured: true,
      uniqueViews: 4,
      publishedAt: '2026-10-01T00:00:00.000Z',
      scheduledAt: null,
      tags: ['x'],
    });
  });

  it('reads Popular Exam cards from popular_exam_cards and saves them through one RPC', async () => {
    mocks.rows.popular_exam_cards = [
      {
        id: 'c1',
        exam_id: 'e1',
        title: 'Card',
        route: '/exams/e1',
        tests_count: '5 Tests',
        card_gradient_start: '#000',
        card_gradient_end: '#fff',
        order_index: 1,
        is_active: true,
      },
    ];
    const cards = await getPopularExams();
    expect(tables()).toContain('popular_exam_cards');
    expect(tables()).not.toContain('app_settings');
    expect(cards[0]).toMatchObject({ id: 'c1', examId: 'e1', title: 'Card' });

    await savePopularExams(cards);
    expect(mocks.rpc).toHaveBeenCalledWith('admin_save_popular_exam_cards', {
      p_cards: [expect.objectContaining({ id: 'c1', orderIndex: 1 })],
    });
  });

  it('reports a Popular Exam save the server did not confirm', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'denied' } });
    await expect(savePopularExams([])).rejects.toThrow('denied');
  });
});
