import type { CouponItem } from '@/types';
import { getKolkataDateString } from '@/services/domains/admin.dashboard';

/** The Kolkata calendar day (YYYY-MM-DD) of a stored coupon timestamp, for date inputs. */
export function couponFormDate(iso?: string): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return '';
  return getKolkataDateString(new Date(iso));
}

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface CouponRowItem {
  id: number | string;
  code: string;
  title: string;
  subtitle: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  applicablePlans: string;
  planBadgeClass: string;
  usedCount: number;
  totalLimit: number;
  validFrom: string;
  validUntil: string;
  status: 'Active' | 'Scheduled' | 'Expired';
  statusBadgeClass: string;
  description?: string;
  isFirstTimeOnly?: boolean;
  source?: CouponItem;
}
