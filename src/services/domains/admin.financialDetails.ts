import { supabaseRuntime as supabase } from '@/lib/supabase';
import type { AdminPaymentRow, AdminSubscriptionRow } from '@/types';

const PAYMENT_COLUMNS =
  'id, user_id, amount, status, refund_id, refund_amount, gateway, transaction_id, currency, raw_response';

interface PaymentRecord {
  user_id: string;
  amount: number | string | null;
  status: string;
  refund_amount?: number | string | null;
  raw_response?: { requires_refund?: unknown } | null;
}

/** Money actually kept from a payment, in paise: refunds and payments owed back excluded. */
function retainedPaise(p: PaymentRecord): number {
  if (p.raw_response?.requires_refund === true || p.raw_response?.requires_refund === 'true') {
    return 0;
  }
  if (p.status !== 'completed' && p.status !== 'refunded') return 0;
  const amount = Math.round(Number(p.amount) * 100);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  const refunded =
    p.refund_amount != null
      ? Math.round(Number(p.refund_amount) * 100)
      : p.status === 'refunded'
        ? amount
        : 0;
  return Math.max(0, amount - (Number.isFinite(refunded) ? refunded : amount));
}

/** Upgrade payments keep pointing subscriptions.payment_id at the original purchase. */
async function loadUpgradePayments(
  subscriptionIds: string[]
): Promise<Map<string, PaymentRecord[]> | null> {
  if (!subscriptionIds.length) return new Map();
  const { data: changes, error } = await supabase
    .from('subscription_changes')
    .select('subscription_id, payment_id')
    .eq('change_type', 'upgrade')
    .is('reverted_at', null)
    .in('subscription_id', subscriptionIds);
  if (error || !changes) return null;
  const result = new Map<string, PaymentRecord[]>();
  if (!changes.length) return result;
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .in(
      'id',
      changes.map((change) => change.payment_id)
    );
  if (paymentsError || !payments) return null;
  const byId = new Map(payments.map((payment) => [payment.id, payment]));
  for (const change of changes) {
    const payment = byId.get(change.payment_id);
    if (!payment) continue;
    result.set(change.subscription_id, [...(result.get(change.subscription_id) ?? []), payment]);
  }
  return result;
}

/** Join on the actual payment link, never a plan's current price or user alone. */
export async function enrichAdminSubscriptionPayments(
  rows: AdminSubscriptionRow[]
): Promise<AdminSubscriptionRow[]> {
  const ids = [...new Set(rows.flatMap((row) => (row.paymentId ? [row.paymentId] : [])))];
  if (!ids.length) return rows;
  try {
    const { data, error } = await supabase.from('payments').select(PAYMENT_COLUMNS).in('id', ids);
    if (error || !data) return rows;
    const payments = new Map(data.map((payment) => [payment.id, payment]));
    const upgradePayments = await loadUpgradePayments(rows.map((row) => row.id)).catch(() => null);
    return rows.map((row) => {
      const payment = row.paymentId ? payments.get(row.paymentId) : undefined;
      if (!payment || payment.user_id !== row.userId) return row;
      const amount = payment.amount == null ? NaN : Number(payment.amount);
      const upgrades = upgradePayments?.get(row.id) ?? [];
      return {
        ...row,
        paymentAmount: Number.isFinite(amount) && amount >= 0 ? amount : undefined,
        paymentStatus: payment.refund_id ? 'refunded' : payment.status,
        paymentGateway: payment.gateway || undefined,
        paymentTransactionId: payment.transaction_id || undefined,
        paymentCurrency: payment.currency || undefined,
        // Unknown when the upgrade lookup failed, so the KPI falls back rather than undercounting silently.
        recordedRevenue: upgradePayments
          ? [payment, ...upgrades.filter((p) => p.user_id === row.userId)].reduce(
              (paise, p) => paise + retainedPaise(p),
              0
            ) / 100
          : undefined,
      };
    });
  } catch {
    // Optional financial lookup unavailable: leave fields unknown, not fabricated.
    return rows;
  }
}

export async function enrichAdminPaymentSubscriptions(
  rows: AdminPaymentRow[]
): Promise<AdminPaymentRow[]> {
  if (!rows.length) return rows;
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, payment_id, status, expires_at, created_at')
      .in(
        'payment_id',
        rows.map((row) => row.id)
      )
      .order('created_at', { ascending: false });
    if (error || !data) return rows;
    const subscriptions = new Map<string, (typeof data)[number]>();
    for (const subscription of data) {
      if (!subscriptions.has(subscription.payment_id)) {
        subscriptions.set(subscription.payment_id, subscription);
      }
    }
    return rows.map((row) => {
      const subscription = subscriptions.get(row.id);
      if (!subscription || subscription.user_id !== row.userId) return row;
      return {
        ...row,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionExpiresAt: subscription.expires_at || undefined,
      };
    });
  } catch {
    return rows;
  }
}

export async function enrichAdminSubscriptionAvatars(
  rows: AdminSubscriptionRow[]
): Promise<AdminSubscriptionRow[]> {
  if (!rows.length) return rows;

  const missingUserIds = [
    ...new Set(rows.filter((r) => !r.avatarUrl && r.userId).map((r) => r.userId)),
  ];
  const missingEmails = [
    ...new Set(
      rows
        .filter((r) => !r.avatarUrl && r.studentEmail)
        .map((r) => r.studentEmail.toLowerCase().trim())
    ),
  ];

  if (!missingUserIds.length && !missingEmails.length) return rows;

  try {
    const avatarMap = new Map<string, string>();

    if (missingUserIds.length > 0) {
      const { data: byId } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', missingUserIds);
      if (byId) {
        byId.forEach((p) => {
          if (p.avatar_url) avatarMap.set(p.id, p.avatar_url);
        });
      }
    }

    if (missingEmails.length > 0) {
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('email, avatar_url')
        .in('email', missingEmails);
      if (byEmail) {
        byEmail.forEach((p) => {
          if (p.avatar_url && p.email) {
            avatarMap.set(p.email.toLowerCase().trim(), p.avatar_url);
          }
        });
      }
    }

    return rows.map((row) => {
      if (row.avatarUrl) return row;
      const avatar =
        (row.userId ? avatarMap.get(row.userId) : undefined) ||
        (row.studentEmail ? avatarMap.get(row.studentEmail.toLowerCase().trim()) : undefined);
      return {
        ...row,
        avatarUrl: avatar || undefined,
      };
    });
  } catch {
    return rows;
  }
}

export async function enrichAdminPaymentAvatars(
  rows: AdminPaymentRow[]
): Promise<AdminPaymentRow[]> {
  if (!rows.length) return rows;

  const missingUserIds = [
    ...new Set(rows.filter((r) => !r.avatarUrl && r.userId).map((r) => r.userId)),
  ];
  const missingEmails = [
    ...new Set(
      rows
        .filter((r) => !r.avatarUrl && r.studentEmail)
        .map((r) => r.studentEmail.toLowerCase().trim())
    ),
  ];

  if (!missingUserIds.length && !missingEmails.length) return rows;

  try {
    const avatarMap = new Map<string, string>();

    if (missingUserIds.length > 0) {
      const { data: byId } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', missingUserIds);
      if (byId) {
        byId.forEach((p) => {
          if (p.avatar_url) avatarMap.set(p.id, p.avatar_url);
        });
      }
    }

    if (missingEmails.length > 0) {
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('email, avatar_url')
        .in('email', missingEmails);
      if (byEmail) {
        byEmail.forEach((p) => {
          if (p.avatar_url && p.email) {
            avatarMap.set(p.email.toLowerCase().trim(), p.avatar_url);
          }
        });
      }
    }

    return rows.map((row) => {
      if (row.avatarUrl) return row;
      const avatar =
        (row.userId ? avatarMap.get(row.userId) : undefined) ||
        (row.studentEmail ? avatarMap.get(row.studentEmail.toLowerCase().trim()) : undefined);
      return {
        ...row,
        avatarUrl: avatar || undefined,
      };
    });
  } catch {
    return rows;
  }
}
