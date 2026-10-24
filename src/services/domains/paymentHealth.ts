import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';

export type PaymentAlertKind = 'function_error' | 'captured_not_activated' | 'refund_required';

export interface PaymentHealthAlert {
  id: string;
  kind: PaymentAlertKind;
  source: string;
  message: string;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  detail: Record<string, unknown>;
}

function toAlert(row: Record<string, unknown>): PaymentHealthAlert {
  return {
    id: String(row.id),
    kind: row.kind as PaymentAlertKind,
    source: String(row.source ?? ''),
    message: String(row.message ?? ''),
    occurrences: Number(row.occurrences ?? 1),
    firstSeenAt: String(row.first_seen_at ?? ''),
    lastSeenAt: String(row.last_seen_at ?? ''),
    detail: (row.detail as Record<string, unknown>) ?? {},
  };
}

/**
 * Open payment alerts (failed payment functions, captured-but-not-activated payments,
 * payments awaiting refund). Returns null when the caller is not a super admin.
 */
export async function getPaymentHealth(): Promise<PaymentHealthAlert[] | null> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('admin_get_payment_health');
  if (error) {
    if (error.code === '42501') return null;
    throw error;
  }
  return Array.isArray(data) ? data.map((row) => toAlert(row as Record<string, unknown>)) : [];
}

export async function resolvePaymentAlert(alertId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_resolve_payment_alert', { p_alert_id: alertId });
  if (error) throw error;
}
