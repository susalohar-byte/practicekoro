import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ values: {} as Record<string, unknown>, error: false }));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    from: () => {
      let id = '';
      const q = {
        select: () => q,
        eq: (_key: string, value: string) => {
          id = value;
          return q;
        },
        maybeSingle: async () => ({
          data: { value: m.values[id] },
          error: m.error ? { message: 'unavailable' } : null,
        }),
      };
      return q;
    },
  },
}));
import { bannerService } from './bannerService';
import { getPopularExams } from './domains/admin.exams';
import { getPopularTestSeriesCards } from './domains/admin.testSeries';
beforeEach(() => {
  m.values = {};
  m.error = false;
});
describe('Admin-owned homepage asset reads', () => {
  it('does not inject seed exams or series when no admin configuration exists', async () => {
    expect(await getPopularExams({ configuredOnly: true })).toEqual([]);
    expect(await getPopularTestSeriesCards({ configuredOnly: true })).toEqual([]);
  });
  it('returns exact stored image URLs and excludes malformed config entries', async () => {
    m.values.popular_exams_config = [
      { id: 'e', cardBgImage: 'https://stored.test/exam.webp', orderIndex: 0 },
      null,
    ];
    expect(await getPopularExams({ configuredOnly: true })).toEqual([
      { id: 'e', cardBgImage: 'https://stored.test/exam.webp', orderIndex: 0 },
    ]);
  });
  it('propagates configuration read errors rather than displaying fictional defaults', async () => {
    m.error = true;
    await expect(getPopularExams({ configuredOnly: true })).rejects.toThrow('unavailable');
    await expect(getPopularTestSeriesCards({ configuredOnly: true })).rejects.toThrow(
      'unavailable'
    );
  });
  it('strict homepage banners never widen a free student into a pro-only campaign', async () => {
    m.values.banners_hero_list = [
      {
        id: 'pro',
        title: 'Pro campaign',
        isActive: true,
        imageUrl: 'https://stored.test/pro.webp',
        displayOrder: 0,
        targetAudience: 'pro',
        placement: 'home_hero',
      },
    ];
    expect(
      await bannerService.getActiveBanners({
        audience: 'free',
        placement: 'home_hero',
        strictAudience: true,
        storedImagesOnly: true,
      })
    ).toEqual([]);
  });
  it('does not replace a missing stored banner image with a static demo asset', async () => {
    m.values.banners_hero_list = [
      {
        id: 'missing',
        title: 'Missing artwork',
        isActive: true,
        displayOrder: 0,
        targetAudience: 'all',
        placement: 'home_hero',
      },
    ];
    expect(
      await bannerService.getActiveBanners({
        audience: 'free',
        strictAudience: true,
        storedImagesOnly: true,
      })
    ).toEqual([]);
  });
});
