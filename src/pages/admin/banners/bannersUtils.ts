import type { HeroBanner } from '@/types';

// ============================================================================
// DATA MODELS & PRESETS
// ============================================================================

export type BannerType = 'Test Series' | 'Offer' | 'Subject' | 'Brand' | 'PYQ';
export type BannerStatus = 'Active' | 'Scheduled' | 'Archived' | 'Draft';
export type OpenInTarget = 'Same Tab' | 'New Tab';

export interface AdminBannerItem {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  bannerType: BannerType;
  showTextOverlay?: boolean;
  linkUrl: string;
  openIn: OpenInTarget;
  devices: {
    desktop: boolean;
    mobile: boolean;
  };
  startDate: string; // "01 Sep 2026" or "01-09-2026"
  endDate: string; // "30 Sep 2026" or "30-09-2026"
  hasDateRange: boolean;
  /** Raw ISO schedule boundaries as stored on the banner record. */
  startsAt?: string;
  expiresAt?: string;
  status: BannerStatus;
  imageUrl: string;
  fileName: string;
  clickCount: number;
  badgeText?: string;
  ctaText?: string;
}

// Helper to map DB HeroBanner to AdminBannerItem
export const pad2 = (n: number) => String(n).padStart(2, '0');

/** ISO timestamp → local "YYYY-MM-DD" for <input type="date">. */
export function isoToDateInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Local "YYYY-MM-DD" → ISO; start = local start of day, end = local end of day. */
export function dateInputToIso(value: string, edge: 'start' | 'end'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return '';
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const date =
    edge === 'start' ? new Date(y, mo, d, 0, 0, 0, 0) : new Date(y, mo, d, 23, 59, 59, 999);
  return date.toISOString();
}

/** Derive the admin status from the stored activity flag and schedule. */
export function deriveBannerStatus(
  banner: Pick<HeroBanner, 'isActive' | 'startsAt' | 'expiresAt'>,
  now = Date.now()
): BannerStatus {
  const start = banner.startsAt ? new Date(banner.startsAt).getTime() : NaN;
  const end = banner.expiresAt ? new Date(banner.expiresAt).getTime() : NaN;
  if (!isNaN(end) && end < now) return 'Archived';
  if (banner.isActive && !isNaN(start) && start > now) return 'Scheduled';
  return banner.isActive ? 'Active' : 'Draft';
}

/**
 * Map the admin status + schedule to the stored fields. Scheduled = active with a future start;
 * Archived = inactive with an expiry that has passed (set to now if not already past).
 */
export function bannerStatusToRecord(
  status: BannerStatus,
  startsAt: string,
  expiresAt: string,
  now = Date.now()
): { isActive: boolean; startsAt: string; expiresAt: string } {
  if (startsAt && expiresAt && new Date(expiresAt).getTime() < new Date(startsAt).getTime())
    throw new Error('End date must be on or after the start date.');
  if (status === 'Scheduled') {
    if (!startsAt || new Date(startsAt).getTime() <= now)
      throw new Error('Choose a future start date for a scheduled banner.');
    return { isActive: true, startsAt, expiresAt };
  }
  if (status === 'Archived') {
    const expired = expiresAt && new Date(expiresAt).getTime() < now;
    return {
      isActive: false,
      startsAt,
      expiresAt: expired ? expiresAt : new Date(now).toISOString(),
    };
  }
  return { isActive: status === 'Active', startsAt, expiresAt };
}

export function mapHeroBannerToAdminItem(banner: HeroBanner, index: number): AdminBannerItem {
  let bType: BannerType = 'Test Series';
  if (
    banner.title.toLowerCase().includes('offer') ||
    banner.title.toLowerCase().includes('discount')
  ) {
    bType = 'Offer';
  } else if (
    banner.title.toLowerCase().includes('science') ||
    banner.title.toLowerCase().includes('subject')
  ) {
    bType = 'Subject';
  } else if (
    banner.title.toLowerCase().includes('brand') ||
    banner.title.toLowerCase().includes('platform')
  ) {
    bType = 'Brand';
  } else if (banner.title.toLowerCase().includes('pyq')) {
    bType = 'PYQ';
  }

  const hasRange = Boolean(banner.startsAt && banner.expiresAt);
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  return {
    id: banner.id,
    order: banner.displayOrder || index + 1,
    title: banner.title,
    subtitle: banner.subtitle || 'Promote mock tests and courses',
    description: banner.subtitle || banner.title,
    bannerType: bType,
    showTextOverlay: Boolean(banner.showTextOverlay ?? banner.bannerType === 'text_overlay'),
    linkUrl: banner.primaryCtaLink || '/test-series',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: formatDate(banner.startsAt),
    endDate: formatDate(banner.expiresAt),
    hasDateRange: hasRange,
    startsAt: banner.startsAt || undefined,
    expiresAt: banner.expiresAt || undefined,
    status: deriveBannerStatus(banner),
    imageUrl: banner.imageUrl || '/images/exam_hero_banner.png',
    fileName: banner.imageUrl ? banner.imageUrl.split('/').pop() || 'banner.jpg' : 'banner.jpg',
    clickCount: banner.clickCount || 0,
    badgeText: banner.badgeText,
    ctaText: banner.primaryCtaText || 'এখনই শুরু করুন →',
  };
}
