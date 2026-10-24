import type { AdminSubscriptionRow } from '@/types';

/** Display helpers for real subscription rows on the Subscription Plans page. */

export function formatSubscriptionDate(value: string | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatSubscriptionAmount(row: AdminSubscriptionRow): string {
  const amount = row.paymentAmount ?? row.recordedRevenue;
  return typeof amount === 'number' && Number.isFinite(amount)
    ? `₹${amount.toLocaleString('en-IN')}`
    : '—';
}

export function subscriptionInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export function subscriptionStatusClass(status: string): string {
  if (status === 'active') return 'bg-[#DCFCE7] text-[#15803D]';
  if (status === 'expired') return 'bg-slate-100 text-slate-600';
  if (status === 'pending') return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
}

export function subscriptionStatusLabel(status: string): string {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
}
