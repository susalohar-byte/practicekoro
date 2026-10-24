import type { AdminPaymentRow, AdminSubscriptionRow, CouponItem } from '@/types';

// Row shapes returned by the direct Supabase queries in this folder. The generated
// Database types do not cover payments/coupons yet, so these mirror each `.select()`.

interface JoinedProfile {
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  avatar_url: string | null;
}

interface JoinedPlan {
  title: string | null;
}

/** `payments` row with the profile/plan joins selected by getAdminPayments. */
export interface PaymentJoinRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  amount: number | string | null;
  currency: string | null;
  gateway: string | null;
  order_id: string | null;
  razorpay_order_id: string | null;
  transaction_id: string | null;
  razorpay_payment_id: string | null;
  status: AdminPaymentRow['status'];
  refund_id: string | null;
  refund_amount: number | string | null;
  refund_reason: string | null;
  refunded_at: string | null;
  created_at: string;
  purchase_type: AdminPaymentRow['purchaseType'] | null;
  requires_refund: string | boolean | null;
  profiles: JoinedProfile | null;
  subscription_plans: JoinedPlan | null;
}

/** The subset of a `payments` row the refund fallback reads. */
export interface PaymentRecordRow {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  amount: number | string | null;
}

/** `subscriptions` row with the profile/plan joins selected by getAdminSubscriptions. */
export interface SubscriptionJoinRow {
  id: string;
  user_id: string;
  plan_id: string;
  status: AdminSubscriptionRow['status'];
  starts_at: string;
  expires_at: string;
  payment_id: string | null;
  created_at: string;
  profiles: JoinedProfile | null;
  subscription_plans: JoinedPlan | null;
}

/** `coupons` row. */
export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: CouponItem['discountType'];
  discount_value: number | string;
  max_discount_amount: number | string | null;
  min_order_amount: number | string | null;
  max_uses: number | string | null;
  used_count: number | string | null;
  max_uses_per_user: number | string | null;
  applicable_plan_id: string | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

/** Columns getAdminCoupons/updateAdminCoupon may write. */
export type CouponWrite = Partial<Omit<CouponRow, 'id' | 'used_count' | 'created_at'>>;

/** Local-storage student record touched when a refund revokes Pro access. */
export interface StoredStudent {
  id: string;
  isPro?: boolean;
  subscriptionStatus?: string;
}

/** Edge-function error that may carry the HTTP response with a JSON `{ error }` body. */
export interface EdgeFunctionError {
  message?: string;
  context?: { json?: () => Promise<{ error?: string } | null> };
}
