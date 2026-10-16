import { invalidateApiCache } from '@/services/apiCache';

/**
 * Cross-surface data-sync events (same-tab).
 *
 * Admin mutations dispatch these after successful writes; student surfaces
 * subscribed to them re-fetch from the database instead of showing stale
 * cached state. Event names are constants so publishers/subscribers can't
 * drift with typos.
 */
export const EXAMS_UPDATED_EVENT = 'practicekoro:exams_updated';
export const SUBSCRIPTION_UPDATED_EVENT = 'practicekoro:subscription_updated';
export const BANNERS_UPDATED_EVENT = 'pk_hero_banners_updated';

function dispatch(name: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name));
  }
}

/** Call after an exam, test, subject, or question is created, updated, or deleted. */
export function notifyExamsUpdated(): void {
  invalidateApiCache('all_admin_');
  invalidateApiCache('exam_content_counts');
  invalidateApiCache('admin_dashboard_overview');
  dispatch(EXAMS_UPDATED_EVENT);
}

/** Call after a subscription/purchase state change. */
export function notifySubscriptionUpdated(): void {
  invalidateApiCache('admin_subscriptions');
  invalidateApiCache('admin_dashboard_overview');
  dispatch(SUBSCRIPTION_UPDATED_EVENT);
}
