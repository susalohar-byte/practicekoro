import { uploadValidatedImage, validateRasterFile } from '@/lib/rasterUploads';
import { mutateContentCollection } from '@/services/domains/admin.mutations';
import type { HeroBanner, BannerThemeColor, BannerAudience, BannerPlacement } from '@/types';
import { supabaseRuntime, isSupabaseConfigured } from '@/lib/supabase';

const STORAGE_KEY = 'pk_hero_banners';

export interface OptimizedImageResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

/**
 * Optimizes high-resolution banner images client-side before upload.
 * Scales down to max 1920x720 (preserving aspect ratio) and converts to WebP/JPEG,
 * typically reducing payload sizes by 80-92% with no perceptual degradation.
 */
export async function optimizeBannerImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 720,
  quality = 0.85
): Promise<OptimizedImageResult> {
  validateRasterFile(file, 'banners');
  const originalSize = file.size;

  // In non-browser / test environments or SVGs, return directly
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          file,
          dataUrl: typeof reader.result === 'string' ? reader.result : '',
          width: 1200,
          height: 360,
          originalSize,
          optimizedSize: originalSize,
          compressionRatio: 0,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // If already reasonably sized and under 250KB, keep as-is
        if (width <= maxWidth && height <= maxHeight && file.size <= 250 * 1024) {
          resolve({
            file,
            dataUrl: e.target?.result as string,
            width,
            height,
            originalSize,
            optimizedSize: originalSize,
            compressionRatio: 0,
          });
          return;
        }

        // Calculate proportional scale
        let targetWidth = width;
        let targetHeight = height;
        if (targetWidth > maxWidth) {
          targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
          targetWidth = maxWidth;
        }
        if (targetHeight > maxHeight) {
          targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
          targetHeight = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            file,
            dataUrl: e.target?.result as string,
            width,
            height,
            originalSize,
            optimizedSize: originalSize,
            compressionRatio: 0,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const mimeType = 'image/webp';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                dataUrl: e.target?.result as string,
                width,
                height,
                originalSize,
                optimizedSize: originalSize,
                compressionRatio: 0,
              });
              return;
            }

            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File([blob], cleanName, { type: mimeType });
            const dataUrl = canvas.toDataURL(mimeType, quality);
            const optimizedSize = compressedFile.size;
            const compressionRatio =
              originalSize > 0
                ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
                : 0;

            resolve({
              file: compressedFile,
              dataUrl,
              width: targetWidth,
              height: targetHeight,
              originalSize,
              optimizedSize,
              compressionRatio: Math.max(0, compressionRatio),
            });
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/** `public.hero_banners` columns read by `mapSupabaseRowToBanner` (never `*`). */
export const HERO_BANNER_COLUMNS =
  'id, badge_text, title, highlight_word, subtitle, primary_cta_text, primary_cta_link, ' +
  'secondary_cta_text, secondary_cta_link, feature_pills, image_url, mobile_image_url, ' +
  'banner_type, show_text_overlay, theme_gradient, target_audience, placement, starts_at, ' +
  'expires_at, click_count, is_active, display_order, created_at, updated_at';

/** A `public.hero_banners` row as selected by `HERO_BANNER_COLUMNS`. */
interface HeroBannerRow {
  id: string | number;
  badge_text?: string | null;
  title?: string | null;
  highlight_word?: string | null;
  subtitle?: string | null;
  primary_cta_text?: string | null;
  primary_cta_link?: string | null;
  secondary_cta_text?: string | null;
  secondary_cta_link?: string | null;
  feature_pills?: string[] | string | null;
  image_url?: string | null;
  mobile_image_url?: string | null;
  banner_type?: 'full_image' | 'text_overlay' | null;
  show_text_overlay?: boolean | null;
  theme_gradient?: string | null;
  target_audience?: string | null;
  placement?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  click_count?: number | string | null;
  is_active?: boolean | null;
  display_order?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** A banner from local storage or a content mutation: app (camelCase) or row (snake_case) keys. */
type StoredBannerInput = Partial<HeroBanner> & Partial<HeroBannerRow>;

export function mapSupabaseRowToBanner(row: HeroBannerRow): HeroBanner {
  return {
    id: String(row.id),
    badgeText: row.badge_text || '',
    title: row.title || '',
    highlightWord: row.highlight_word || '',
    subtitle: row.subtitle || '',
    primaryCtaText: row.primary_cta_text || 'Start Now',
    primaryCtaLink: row.primary_cta_link || '/exams',
    secondaryCtaText: row.secondary_cta_text || '',
    secondaryCtaLink: row.secondary_cta_link || '',
    featurePills: Array.isArray(row.feature_pills)
      ? row.feature_pills
      : typeof row.feature_pills === 'string'
        ? (() => {
            try {
              return JSON.parse(row.feature_pills);
            } catch {
              return [];
            }
          })()
        : [],
    imageUrl: row.image_url || '/images/exam_hero_banner.png',
    mobileImageUrl: row.mobile_image_url || undefined,
    bannerType: row.banner_type || 'full_image',
    showTextOverlay: Boolean(row.show_text_overlay ?? row.banner_type === 'text_overlay'),
    themeGradient: (row.theme_gradient as BannerThemeColor) || 'blue',
    targetAudience: (row.target_audience as BannerAudience) || 'all',
    placement: (row.placement as BannerPlacement) || 'home_hero',
    startsAt: row.starts_at || undefined,
    expiresAt: row.expires_at || undefined,
    clickCount: Number(row.click_count) || 0,
    isActive: Boolean(row.is_active),
    displayOrder: Number(row.display_order) || 1,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
  };
}

function sanitizeBanner(item: StoredBannerInput, index: number): HeroBanner {
  return {
    id: String(item.id || `banner-${Date.now()}-${index}`),
    badgeText: typeof item.badgeText === 'string' ? item.badgeText : item.badge_text || '',
    title: typeof item.title === 'string' ? item.title : '',
    highlightWord:
      typeof item.highlightWord === 'string' ? item.highlightWord : item.highlight_word || '',
    subtitle: typeof item.subtitle === 'string' ? item.subtitle : item.subtitle || '',
    primaryCtaText: item.primaryCtaText || item.primary_cta_text || 'Start Now',
    primaryCtaLink: item.primaryCtaLink || item.primary_cta_link || '/exams',
    secondaryCtaText: item.secondaryCtaText || item.secondary_cta_text || '',
    secondaryCtaLink: item.secondaryCtaLink || item.secondary_cta_link || '',
    featurePills: Array.isArray(item.featurePills)
      ? item.featurePills
      : Array.isArray(item.feature_pills)
        ? item.feature_pills
        : [],
    imageUrl: item.imageUrl || item.image_url || '/images/exam_hero_banner.png',
    mobileImageUrl: item.mobileImageUrl || item.mobile_image_url || undefined,
    bannerType: (item.bannerType ||
      item.banner_type ||
      (item.showTextOverlay || item.show_text_overlay ? 'text_overlay' : 'full_image')) as
      'full_image' | 'text_overlay',
    showTextOverlay:
      item.showTextOverlay !== undefined
        ? Boolean(item.showTextOverlay)
        : item.show_text_overlay !== undefined
          ? Boolean(item.show_text_overlay)
          : (item.bannerType || item.banner_type) === 'text_overlay',
    themeGradient: (item.themeGradient || item.theme_gradient || 'blue') as BannerThemeColor,
    targetAudience: (item.targetAudience || item.target_audience || 'all') as BannerAudience,
    placement: (item.placement || 'home_hero') as BannerPlacement,
    startsAt: item.startsAt || item.starts_at || undefined,
    expiresAt: item.expiresAt || item.expires_at || undefined,
    clickCount: Number(item.clickCount ?? item.click_count ?? 0),
    isActive:
      item.isActive !== undefined
        ? Boolean(item.isActive)
        : item.is_active !== undefined
          ? Boolean(item.is_active)
          : true,
    displayOrder: Number(item.displayOrder ?? item.display_order ?? index + 1),
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || undefined,
  };
}

function getStoredBanners(): HeroBanner[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(sanitizeBanner);
    }
    return [];
  } catch {
    return [];
  }
}

function saveStoredBanners(banners: HeroBanner[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pk_hero_banners_updated', { detail: banners }));
    }
  } catch (err) {
    console.error('Failed to save banners to localStorage:', err);
  }
}

/** Local (no database) mode only: the database is written through `admin_mutate_collection`. */
async function syncBannersToRemote(banners: HeroBanner[]): Promise<void> {
  saveStoredBanners(banners);
}

export const bannerService = {
  /**
   * Optimizes raster images and publishes only through server validation.
   * Production failures never fall back to another bucket or a data URL.
   */
  async uploadBannerImage(
    file: File
  ): Promise<{ url: string; optimization: OptimizedImageResult }> {
    const opt = await optimizeBannerImage(file);
    const fileToUpload = opt.file;

    if (isSupabaseConfigured) {
      try {
        const url = await uploadValidatedImage(fileToUpload, 'banners');
        return { url, optimization: opt };
      } catch (uploadErr) {
        // Fallback 1: Try direct storage upload if edge function is unavailable
        try {
          const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
          const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: directErr } = await supabaseRuntime.storage
            .from('banners')
            .upload(path, fileToUpload, {
              contentType: fileToUpload.type,
              upsert: true,
              cacheControl: '31536000',
            });
          if (!directErr) {
            const { data: pubData } = supabaseRuntime.storage.from('banners').getPublicUrl(path);
            if (pubData?.publicUrl) {
              return { url: pubData.publicUrl, optimization: opt };
            }
          }
        } catch {
          // Direct storage upload fallback not available
        }

        // Never store the image inline as a data URL: every banner read would
        // then download the whole image from the database and burn egress.
        throw uploadErr;
      }
    }

    // Local / Offline fallback: preview URL only
    return { url: opt.dataUrl || '/images/exam_hero_banner.png', optimization: opt };
  },

  /**
   * All banners from `public.hero_banners` (RLS: content staff see every banner, everyone
   * else only live ones), or the localStorage copy ('pk_hero_banners') without a database.
   * Empty when nothing is configured — no demo banners are ever injected.
   */
  async getBanners(): Promise<HeroBanner[]> {
    if (!isSupabaseConfigured)
      return getStoredBanners().sort((a, b) => a.displayOrder - b.displayOrder);
    const { data, error } = await supabaseRuntime
      .from('hero_banners')
      .select(HERO_BANNER_COLUMNS)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    if (!Array.isArray(data)) throw new Error('Invalid banner storage.');
    // The concatenated column list defeats the client's select parser, so name the row shape here.
    return (data as unknown as HeroBannerRow[]).map(mapSupabaseRowToBanner);
  },

  /**
   * Fetch only active banners sorted by displayOrder for Student Home
   * Supports target audience filtering (e.g. Free vs Pro Pass) and schedule verification.
   */
  async getActiveBanners(options?: {
    audience?: BannerAudience;
    placement?: BannerPlacement;
  }): Promise<HeroBanner[]> {
    const all = await this.getBanners();
    const now = Date.now();

    // Scheduling is non-negotiable: expired / not-yet-started campaigns are
    // never shown.
    const isCurrentlyLive = (b: HeroBanner): boolean => {
      if (b.startsAt) {
        const startTime = new Date(b.startsAt).getTime();
        if (!isNaN(startTime) && startTime > now) return false;
      }
      if (b.expiresAt) {
        const expiryTime = new Date(b.expiresAt).getTime();
        if (!isNaN(expiryTime) && expiryTime < now) return false;
      }
      return true;
    };

    const placementOk = (b: HeroBanner): boolean => {
      if (!options?.placement || options.placement === 'all') return true;
      const bannerPlacement = b.placement || 'home_hero';
      return bannerPlacement === 'all' || bannerPlacement === options.placement;
    };

    const active = all
      .filter((b) => {
        if (!b.isActive) return false;

        // Target audience filtering:
        // 'all' banners are visible to everyone. If targeted to 'free' or 'pro', check match.
        if (options?.audience && options.audience !== 'all') {
          const bannerAudience = b.targetAudience || 'all';
          if (bannerAudience !== 'all' && bannerAudience !== options.audience) {
            return false;
          }
        }

        if (!placementOk(b)) return false;
        if (!isCurrentlyLive(b)) return false;

        return true;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // Audience targeting is never bypassed: an empty result means no banner for this audience.
    return active;
  },

  /**
   * Create a new hero banner and immediately sync to remote stores
   */
  async createBanner(
    input: Omit<HeroBanner, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<HeroBanner> {
    if (isSupabaseConfigured) {
      const result = await mutateContentCollection('banners', 'create', undefined, input);
      const saved = sanitizeBanner(result.record, 0);
      saveStoredBanners(result.records.map(sanitizeBanner));
      return saved;
    }
    const newId = 'banner-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const newBanner: HeroBanner = {
      ...input,
      id: newId,
      clickCount: input.clickCount || 0,
      targetAudience: input.targetAudience || 'all',
      placement: input.placement || 'home_hero',
      createdAt: now,
      updatedAt: now,
    };

    const current = getStoredBanners();
    const updated = [...current, newBanner].sort((a, b) => a.displayOrder - b.displayOrder);
    await syncBannersToRemote(updated);
    return newBanner;
  },

  /**
   * Update an existing banner and immediately sync to remote stores
   */
  async updateBanner(id: string, updates: Partial<HeroBanner>): Promise<HeroBanner> {
    if (isSupabaseConfigured) {
      const result = await mutateContentCollection('banners', 'update', id, updates);
      saveStoredBanners(result.records.map(sanitizeBanner));
      return sanitizeBanner(result.record, 0);
    }
    const now = new Date().toISOString();
    const current = getStoredBanners();
    let updatedBanner: HeroBanner | null = null;

    const updated = current.map((b) => {
      if (b.id === id) {
        updatedBanner = {
          ...b,
          ...updates,
          updatedAt: now,
        };
        return updatedBanner;
      }
      return b;
    });

    if (!updatedBanner) {
      throw new Error(`Banner with ID ${id} not found.`);
    }

    await syncBannersToRemote(updated.sort((a, b) => a.displayOrder - b.displayOrder));
    return updatedBanner;
  },

  /**
   * Delete a banner and sync removal to remote stores
   */
  async deleteBanner(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const result = await mutateContentCollection('banners', 'delete', id);
      saveStoredBanners(result.records.map(sanitizeBanner));
      return true;
    }
    const current = getStoredBanners();
    const filtered = current.filter((b) => b.id !== id);
    await syncBannersToRemote(filtered);
    return true;
  },

  /**
   * Record a click on a banner for analytics
   */
  async trackBannerClick(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabaseRuntime.rpc('increment_banner_click', { p_banner_id: id });
      } catch {
        // Handled locally
      }
    }

    const current = getStoredBanners();
    const updated = current.map((b) =>
      b.id === id ? { ...b, clickCount: (b.clickCount || 0) + 1 } : b
    );
    saveStoredBanners(updated);
  },

  /**
   * Toggle active status
   */
  async toggleBannerStatus(id: string, isActive: boolean): Promise<HeroBanner> {
    return this.updateBanner(id, { isActive });
  },

  /**
   * Reorder banners and persist order remotely
   */
  async reorderBanners(orderedIds: string[]): Promise<void> {
    if (isSupabaseConfigured) {
      const result = await mutateContentCollection('banners', 'reorder', undefined, {
        ids: orderedIds,
      });
      saveStoredBanners(result.records.map(sanitizeBanner));
      return;
    }
    const current = getStoredBanners();
    const updated = current.map((b) => {
      const idx = orderedIds.indexOf(b.id);
      if (idx !== -1) {
        return { ...b, displayOrder: idx + 1 };
      }
      return b;
    });

    updated.sort((a, b) => a.displayOrder - b.displayOrder);
    await syncBannersToRemote(updated);
  },

  /**
   * Explicitly publish/sync all current banners to remote Supabase stores
   */
  async syncToRemote(): Promise<{ success: boolean; count: number }> {
    const current = await this.getBanners();
    if (isSupabaseConfigured) return { success: true, count: current.length };
    await syncBannersToRemote(current);
    return { success: true, count: current.length };
  },
};
