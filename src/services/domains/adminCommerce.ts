import { notifySubscriptionUpdated } from '@/lib/dataSync';
import { subscriptionsApi } from '@/services/domains/commerce/subscriptions';
import { paymentsApi } from '@/services/domains/commerce/payments';
import { studentsApi } from '@/services/domains/commerce/students';
import { attemptsApi } from '@/services/domains/commerce/attempts';
import { couponsApi } from '@/services/domains/commerce/coupons';
import { analyticsApi } from '@/services/domains/commerce/analytics';

/**
 * Admin subscriptions, payments & dashboard statistics API.
 * Composed from the per-area modules in ./commerce; `this` inside each method is this object.
 */
export const adminCommerceApi = {
  ...subscriptionsApi,
  ...paymentsApi,
  ...studentsApi,
  ...attemptsApi,
  ...couponsApi,
  ...analyticsApi,
};

// Refunds, grants and plan changes move dashboard revenue and Pro counts, which are
// cached for the overview TTL. Drop those caches after every such write that did not
// report failure, so admins never see pre-refund totals.
const SUBSCRIPTION_MUTATIONS = [
  'updateSubscriptionPlan',
  'createSubscriptionPlan',
  'deleteSubscriptionPlan',
  'grantStudentSubscription',
  'revokeStudentSubscription',
  'cancelSubscription',
  'extendSubscription',
  'changeSubscriptionPlan',
  'createAdminSubscription',
  'bulkGrantStudentSubscription',
  'markPaymentRefunded',
  'processPaymentRefund',
] as const;
for (const name of SUBSCRIPTION_MUTATIONS) {
  const original = adminCommerceApi[name] as (...args: unknown[]) => Promise<unknown>;
  (adminCommerceApi as Record<string, unknown>)[name] = async function (
    this: unknown,
    ...args: unknown[]
  ) {
    const result = await original.apply(this, args);
    if (!(
      result &&
      typeof result === 'object' &&
      'success' in result &&
      result.success === false
    )) {
      notifySubscriptionUpdated();
    }
    return result;
  };
}
