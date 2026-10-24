import type { AdminSubscriptionRow } from '@/types';
import type { SubscriptionRecord } from './subscriptionTypes';

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}

export function mapAdminSubscriptionRow(d: AdminSubscriptionRow): SubscriptionRecord {
  const isAct = d.status === 'active' && new Date(d.expiresAt).getTime() > Date.now();
  const formatDate = (value?: string) => {
    if (!value || !Number.isFinite(new Date(value).getTime())) return 'Unavailable';
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  const method: SubscriptionRecord['paymentMethod'] =
    d.paymentGateway === 'razorpay'
      ? 'Razorpay'
      : d.paymentGateway === 'phonepe'
        ? 'PhonePe'
        : d.paymentGateway === 'upi'
          ? 'UPI'
          : '—';
  return {
    id: d.id,
    userId: d.userId,
    studentName: d.studentName || 'Student Aspirant',
    studentEmail: d.studentEmail || '',
    studentPhone: d.studentPhone,
    avatarType: d.avatarUrl && d.avatarUrl.trim() ? 'photo' : 'initials',
    avatarSrc: d.avatarUrl && d.avatarUrl.trim() ? d.avatarUrl.trim() : undefined,
    avatarInitials:
      (d.studentName || 'ST')
        .split(/\s+/)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'ST',
    avatarBgColor: 'bg-blue-100',
    avatarTextColor: 'text-blue-600',
    plan: d.planTitle || 'Pro Pass',
    planFullTitle: d.planTitle || 'Pro Pass',
    planBadgeClass: isAct ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#DC2626]',
    amount: d.paymentAmount,
    paymentId: d.paymentId,
    paymentStatus: d.paymentStatus,
    paymentCurrency: d.paymentCurrency,
    recordedRevenue: d.recordedRevenue,
    paymentMethod: method,
    startDate: formatDate(d.startsAt),
    endDate: formatDate(d.expiresAt),
    expiresAtIso: d.expiresAt,
    status: isAct ? 'Active' : 'Expired',
    statusBadgeClass: isAct ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#DC2626]',
    daysLeft: Number.isFinite(new Date(d.expiresAt).getTime())
      ? Math.max(0, Math.ceil((new Date(d.expiresAt).getTime() - Date.now()) / 86400000))
      : undefined,
    autoRenew: false,
    transactionId: d.paymentTransactionId,
    createdAt: d.createdAt ? new Date(d.createdAt).toLocaleString('en-GB') : undefined,
    lastUpdated: d.createdAt ? new Date(d.createdAt).toLocaleString('en-GB') : undefined,
  };
}
